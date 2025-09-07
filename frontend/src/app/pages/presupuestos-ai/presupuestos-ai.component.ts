import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClienteService, Cliente } from '../../services/cliente.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { PresupuestoService } from '../../services/presupuesto.service';
import { PresupuestoItem, PresupuestoRequest } from '../../types/presupuesto';
import { PresupuestoAiService } from '../../services/presupuesto-ai.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-presupuestos-ai',
  standalone: true,
  templateUrl: './presupuestos-ai.component.html',
  styleUrls: ['./presupuestos-ai.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class PresupuestosAiComponent implements OnInit {
  form!: FormGroup;
  clientes: Cliente[] = [];
  productos: Producto[] = [];
  items: PresupuestoItem[] = [];
  nuevoItem: PresupuestoItem = { productoId: null, cantidad: 1, precioUnitario: 0, totalItem: 0 };
  prompt: string = '';
  totalGlobal: number = 0;
  formularioVisible: boolean = false;
  toastMensaje: string | null = null;

  tiposEvento = [
    { label: 'Cumpleaños', value: 'Cumpleaños' },
    { label: 'Casamiento', value: 'Casamiento' },
    { label: 'Corporativo', value: 'Corporativo' }
  ];

  chatMensajes: { texto: string, tipo: 'bot' | 'usuario', timestamp?: Date }[] = [
    { texto: 'Hola 👋 ¿En qué puedo ayudarte hoy?', tipo: 'bot', timestamp: new Date() }
  ];

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private productoService: ProductoService,
    private presupuestoService: PresupuestoService,
    private presupuestoAiService: PresupuestoAiService
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      clienteId: [null, Validators.required],
      tipoEvento: ['', Validators.required],
      comentarios: ['']
    });

    this.clienteService.getClientes().subscribe(data => this.clientes = data);
    this.productoService.obtenerProductos().subscribe(data => this.productos = data);
  }

  mostrarToast(mensaje: string) {
    this.toastMensaje = mensaje;
    setTimeout(() => {
      this.toastMensaje = null;
    }, 3000);
  }

  // 🔹 Normalizar operación en caso de incoherencias
  private normalizarOperacion(respuesta: any): 'CREAR' | 'AGREGAR' | 'MODIFICAR' | 'ELIMINAR' | 'REEMPLAZAR' | 'CONSULTAR' {
    const operacion = respuesta.operacion as string;
    const items = respuesta.presupuesto?.items || [];

    if (items.length > 0 && operacion === 'CONSULTAR' && this.items.length === 0) {
      console.warn('[IA] Corregido: CONSULTAR -> CREAR porque vinieron items nuevos');
      return 'CREAR';
    }

    if (items.length > 0 && operacion === 'CONSULTAR' && this.items.length > 0) {
      console.warn('[IA] Corregido: CONSULTAR -> MODIFICAR porque ya existían items');
      return 'MODIFICAR';
    }

    if (items.length === 0 && operacion !== 'CONSULTAR') {
      console.warn('[IA] Corregido: Operación -> CONSULTAR porque no vinieron items');
      return 'CONSULTAR';
    }

    return operacion as any;
  }

  // 🔹 Merge inteligente de items según la operación
  private mergeItems(previos: PresupuestoItem[], nuevos: PresupuestoItem[], modo: string): PresupuestoItem[] {
    console.log('[mergeItems] Modo:', modo);
    console.log('[mergeItems] Previos:', previos);
    console.log('[mergeItems] Nuevos:', nuevos);

    switch (modo) {
      case 'CREAR':
      case 'REEMPLAZAR':
        return [...nuevos];

      case 'AGREGAR':
        const agregados = [...previos];
        nuevos.forEach(nuevo => {
          const existente = agregados.find(i => i.productoId === nuevo.productoId);
          if (existente) {
            existente.cantidad += nuevo.cantidad;
            existente.totalItem = existente.precioUnitario * existente.cantidad;
          } else {
            agregados.push(nuevo);
          }
        });
        return agregados;

      case 'MODIFICAR':
        return previos.map(item => {
          const modificado = nuevos.find(n => n.productoId === item.productoId);
          if (modificado) {
            return {
              ...item,
              cantidad: modificado.cantidad,
              totalItem: modificado.precioUnitario * modificado.cantidad
            };
          }
          return item;
        });

      case 'ELIMINAR':
        return previos.filter(item => !nuevos.some(n => n.productoId === item.productoId));

      case 'CONSULTAR':
        return [...previos];

      default:
        console.warn('[mergeItems] ⚠️ Operación no reconocida');
        return [...previos];
    }
  }

  // 🔹 Enviar prompt a IA
  enviarPromptAI(): void {
    const clienteId = this.form.value.clienteId;
    const tipoEvento = this.form.value.tipoEvento;

    if (!clienteId || !tipoEvento || !this.prompt) {
      this.mostrarToast('Seleccioná cliente, tipo de evento y escribí un mensaje.');
      this.agregarMensajeBot('⚠️ Seleccioná cliente, tipo de evento y escribí un mensaje.');
      return;
    }

    const dto = {
      clienteId,
      comentarios: this.prompt,
      presupuestoActual: {
        clienteId,
        estado: 'PENDIENTE',
        tipoEvento,
        comentarios: '',
        gananciaEstimada: 0,
        items: this.items
      }
    };

    this.agregarMensajeUsuario(this.prompt);
    this.prompt = '';

    console.log('[PresupuestoAI Service] Enviando DTO a Gemini:', dto);

    this.presupuestoAiService.generarPresupuestoAI(dto).subscribe({
      next: (response) => {
        let clean = typeof response === 'string' ? response.trim() : response;
        if (clean.startsWith('```json')) clean = clean.slice(7);
        if (clean.endsWith('```')) clean = clean.slice(0, -3);

        const respuesta = JSON.parse(clean);
        console.log('[IA] Respuesta completa:', respuesta);
        console.log('[IA] Items previos:', this.items);

        this.agregarMensajeBot(respuesta.mensaje);

        // 🚩 Corregimos operación si vino incoherente
        const operacion = this.normalizarOperacion(respuesta);
        console.log('[IA] Operación recibida (normalizada):', operacion);

        const itemsIA = (respuesta.presupuesto?.items || []) as any[];
        console.log('[IA] Items nuevos:', itemsIA);

        if (!Array.isArray(itemsIA) || itemsIA.length === 0) {
          if (operacion !== 'CONSULTAR') {
            console.warn('[IA] ❌ La IA no devolvió productos válidos para la operación:', operacion);
            this.mostrarToast('La IA no devolvió productos válidos.');
          }
          return;
        }

        // 🔹 Normalizamos a PresupuestoItem[]
        const itemsNormalizados: PresupuestoItem[] = itemsIA.map((item: any) => {
          const nombre = item.producto || item.nombre;
          const producto = this.productos.find(p => p.nombre === nombre);
          return {
            productoId: producto?.id || item.id || item.producto_id || null,
            cantidad: item.cantidad || 1,
            precioUnitario: item.precio_unitario || producto?.precioUnitario || 0,
            totalItem: item.total || ((item.precio_unitario || producto?.precioUnitario || 0) * (item.cantidad || 1))
          };
        });

        // 🔹 Aplicamos merge según la operación recibida
        this.items = this.mergeItems(this.items, itemsNormalizados, operacion);
        this.actualizarTotalGlobal();
        this.formularioVisible = true;
      },
      error: () => {
        console.error('[enviarPromptAI] ERROR');
        this.mostrarToast('No se pudo generar el presupuesto AI.');
      }
    });
  }

  // 🔹 Utilidades
  setPrecioUnitario() {
    const producto = this.productos.find(p => p.id === this.nuevoItem.productoId);
    if (producto) {
      this.nuevoItem.precioUnitario = producto.precioUnitario;
      this.nuevoItem.totalItem = producto.precioUnitario * this.nuevoItem.cantidad;
      this.onCantidadChange();
    }
  }

  onCantidadChange() {
    this.nuevoItem.totalItem = this.nuevoItem.cantidad * this.nuevoItem.precioUnitario;
    this.actualizarTotalGlobal();
  }

  actualizarTotalGlobal() {
    const totalItems = this.items.reduce((acc, item) => acc + item.totalItem, 0);
    this.totalGlobal = totalItems + this.nuevoItem.totalItem;
  }

  agregarItem() {
    if (!this.nuevoItem.productoId || this.nuevoItem.cantidad <= 0) {
      this.mostrarToast('Seleccioná un producto y cantidad válida.');
      return;
    }
    const producto = this.productos.find(p => p.id === this.nuevoItem.productoId);
    if (!producto) return;
    const existente = this.items.find(i => i.productoId === producto.id);
    if (existente) {
      existente.cantidad += this.nuevoItem.cantidad;
      existente.totalItem = existente.cantidad * existente.precioUnitario;
    } else {
      this.items.push({
        productoId: producto.id,
        cantidad: this.nuevoItem.cantidad,
        precioUnitario: producto.precioUnitario,
        totalItem: producto.precioUnitario * this.nuevoItem.cantidad
      });
    }
    this.mostrarToast(`${producto.nombre} x${this.nuevoItem.cantidad} agregado`);
    this.nuevoItem = { productoId: null, cantidad: 1, precioUnitario: 0, totalItem: 0 };
    this.actualizarTotalGlobal();
  }

  eliminarItem(index: number): void {
    this.items.splice(index, 1);
    this.actualizarTotalGlobal();
    this.mostrarToast('Ítem removido.');
  }

  crearPresupuesto(): void {
    if (this.form.invalid || this.items.length === 0) {
      this.mostrarToast('Completá los datos y agrega al menos un producto.');
      return;
    }

    const dto: PresupuestoRequest = {
      clienteId: this.form.value.clienteId,
      estado: 'PROPUESTO',
      tipoEvento: this.form.value.tipoEvento,
      comentarios: this.form.value.comentarios,
      gananciaEstimada: 0,
      items: this.items
    };

    this.presupuestoService.crearPresupuesto(dto).subscribe(() => {
      this.mostrarToast('Presupuesto guardado correctamente.');
      this.resetFormulario();
    });
  }

  resetFormulario() {
    this.form.reset();
    this.items = [];
    this.totalGlobal = 0;
    this.formularioVisible = false;
    this.chatMensajes = [
      { texto: 'Hola 👋 ¿En qué puedo ayudarte hoy?', tipo: 'bot' }
    ];
    this.prompt = '';
  }

  agregarMensajeUsuario(texto: string) {
    this.chatMensajes.push({ texto, tipo: 'usuario', timestamp: new Date() });
    this.scrollChat();
  }

  agregarMensajeBot(texto: string) {
    this.chatMensajes.push({ texto, tipo: 'bot', timestamp: new Date() });
    this.scrollChat();
  }

  private scrollChat() {
    setTimeout(() => {
      const contenedor = document.querySelector('.chat-mensajes');
      if (contenedor) {
        contenedor.scrollTop = contenedor.scrollHeight;
      }
    }, 100);
  }
}
