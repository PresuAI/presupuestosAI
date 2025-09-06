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
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
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

  // ✅ Toast con severidad
  toastMensaje: string | null = null;
  toastTipo: 'success' | 'error' | 'info' = 'info';
  private toastTimer: any;

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
    // Iniciar selects en null para que el placeholder quede seleccionado
    this.form = this.fb.group({
      clienteId: [null, Validators.required],
      tipoEvento: [null, Validators.required],
      comentarios: ['']
    });

    this.clienteService.getClientes().subscribe(data => this.clientes = data);
    this.productoService.obtenerProductos().subscribe(data => this.productos = data);
  }

  // ===== Toast helpers =====
  mostrarToast(mensaje: string, tipo: 'success' | 'error' | 'info' = 'info', ms = 3000) {
    this.toastMensaje = mensaje;
    this.toastTipo = tipo;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toastMensaje = null), ms);
  }

  // ===== IA helpers =====
  private normalizarOperacion(respuesta: any): 'CREAR' | 'AGREGAR' | 'MODIFICAR' | 'ELIMINAR' | 'REEMPLAZAR' | 'CONSULTAR' {
    const operacion = respuesta.operacion as string;
    const items = respuesta.presupuesto?.items || [];
    if (items.length > 0 && operacion === 'CONSULTAR' && this.items.length === 0) return 'CREAR';
    if (items.length > 0 && operacion === 'CONSULTAR' && this.items.length > 0) return 'MODIFICAR';
    if (items.length === 0 && operacion !== 'CONSULTAR') return 'CONSULTAR';
    return operacion as any;
  }

  private mergeItems(previos: PresupuestoItem[], nuevos: PresupuestoItem[], modo: string): PresupuestoItem[] {
    switch (modo) {
      case 'CREAR':
      case 'REEMPLAZAR':
        return [...nuevos];
      case 'AGREGAR': {
        const agregados = [...previos];
        nuevos.forEach(nuevo => {
          const existente = agregados.find(i => i.productoId === nuevo.productoId);
          if (existente) {
            existente.cantidad += nuevo.cantidad;
            existente.totalItem = existente.cantidad * existente.precioUnitario;
          } else {
            agregados.push(nuevo);
          }
        });
        return agregados;
      }
      case 'MODIFICAR':
        return previos.map(item => {
          const modificado = nuevos.find(n => n.productoId === item.productoId);
          return modificado
            ? { ...item, cantidad: modificado.cantidad, totalItem: modificado.precioUnitario * modificado.cantidad }
            : item;
        });
      case 'ELIMINAR':
        return previos.filter(item => !nuevos.some(n => n.productoId === item.productoId));
      case 'CONSULTAR':
      default:
        return [...previos];
    }
  }

  enviarPromptAI(): void {
    const clienteId = this.form.value.clienteId;
    const tipoEvento = this.form.value.tipoEvento;

    if (!clienteId || !tipoEvento || !this.prompt) {
      this.mostrarToast('Seleccioná cliente, tipo de evento y escribí un mensaje.', 'error');
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

    this.presupuestoAiService.generarPresupuestoAI(dto).subscribe({
      next: (response) => {
        let clean = typeof response === 'string' ? response.trim() : response;
        if (clean.startsWith('```json')) clean = clean.slice(7);
        if (clean.endsWith('```')) clean = clean.slice(0, -3);

        const respuesta = JSON.parse(clean);
        this.agregarMensajeBot(respuesta.mensaje);

        const operacion = this.normalizarOperacion(respuesta);
        const itemsIA = (respuesta.presupuesto?.items || []) as any[];
        if (!Array.isArray(itemsIA) || itemsIA.length === 0) {
          if (operacion !== 'CONSULTAR') this.mostrarToast('La IA no devolvió productos válidos.', 'error');
          return;
        }

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

        this.items = this.mergeItems(this.items, itemsNormalizados, operacion);
        this.actualizarTotalGlobal();
        this.formularioVisible = true;
      },
      error: () => {
        console.error('[enviarPromptAI] ERROR');
        this.mostrarToast('No se pudo generar el presupuesto AI.', 'error');
      }
    });
  }

  // ===== Utilidades =====
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
      this.mostrarToast('Seleccioná un producto y cantidad válida.', 'error');
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
    this.mostrarToast(`${producto.nombre} x${this.nuevoItem.cantidad} agregado`, 'success');
    this.nuevoItem = { productoId: null, cantidad: 1, precioUnitario: 0, totalItem: 0 };
    this.actualizarTotalGlobal();
  }

  eliminarItem(index: number): void {
    this.items.splice(index, 1);
    this.actualizarTotalGlobal();
    this.mostrarToast('Ítem removido.', 'info');
  }

  crearPresupuesto(): void {
    if (this.form.invalid || this.items.length === 0) {
      this.mostrarToast('Completá los datos y agregá al menos un producto.', 'error');
      return;
    }

    const dto: PresupuestoRequest = {
      clienteId: this.form.value.clienteId,
      estado: 'Propuesta',
      tipoEvento: this.form.value.tipoEvento,
      comentarios: this.form.value.comentarios,
      gananciaEstimada: 0,
      items: this.items
    };

    this.presupuestoService.crearPresupuesto(dto).subscribe({
      next: () => {
        this.mostrarToast('Presupuesto guardado correctamente.', 'success');
        this.resetFormulario();
      },
      error: () => {
        this.mostrarToast('No se pudo guardar el presupuesto.', 'error');
      }
    });
  }

  resetFormulario() {
    this.form.reset({ clienteId: null, tipoEvento: null, comentarios: '' });
    this.items = [];
    this.totalGlobal = 0;
    this.formularioVisible = false;
    this.chatMensajes = [{ texto: 'Hola 👋 ¿En qué puedo ayudarte hoy?', tipo: 'bot' }];
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
      if (contenedor) (contenedor as HTMLElement).scrollTop = (contenedor as HTMLElement).scrollHeight;
    }, 100);
  }
}
