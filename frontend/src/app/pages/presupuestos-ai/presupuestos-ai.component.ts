import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';

import { ClienteService, Cliente } from '../../services/cliente.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { PresupuestoService } from '../../services/presupuesto.service';
import { PresupuestoAiService } from '../../services/presupuesto-ai.service';
import { PresupuestoItem, PresupuestoRequest } from '../../types/presupuesto';

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

  // Presupuesto mostrado (reemplazado por la IA)
  items: PresupuestoItem[] = [];
  totalGlobal = 0;

  // UI
  formularioVisible = false;
  prompt = '';
  enProceso = false;

  // Memoria por presupuesto (OpenAI thread)
  private threadId: string | null = null;

  // Toast
  toastMensaje: string | null = null;
  toastTipo: 'success' | 'error' | 'info' = 'info';
  private toastTimer: any;

  // Chat
  chatMensajes: { texto: string; tipo: 'bot' | 'usuario'; timestamp?: Date }[] = [
    { texto: 'Hola 👋 ¿En qué puedo ayudarte hoy?', tipo: 'bot', timestamp: new Date() }
  ];

  tiposEvento = [
    { label: 'Cumpleaños', value: 'Cumpleaños' },
    { label: 'Casamiento', value: 'Casamiento' },
    { label: 'Corporativo', value: 'Corporativo' }
  ];

  // ---- STUBS para la fila "nueva-fila" del template ----
  nuevoItem: PresupuestoItem = { productoId: null, cantidad: 1, precioUnitario: 0, totalItem: 0 };
  setPrecioUnitario(): void {
    const p = this.productos.find(x => x.id === this.nuevoItem.productoId);
    const precio = Number(p?.precioUnitario ?? 0);
    this.nuevoItem.precioUnitario = precio;
    this.nuevoItem.totalItem = precio * Number(this.nuevoItem.cantidad ?? 1);
  }
  onCantidadChange(): void {
    const cant = Number(this.nuevoItem.cantidad ?? 0);
    const precio = Number(this.nuevoItem.precioUnitario ?? 0);
    this.nuevoItem.totalItem = cant * precio;
  }
  agregarItem(): void {
    this.showToast('Para agregar o modificar productos, pedíselo a la IA. Podés borrar con 🗑️.', 'info');
  }

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private productoService: ProductoService,
    private presupuestoService: PresupuestoService,
    private presupuestoAiService: PresupuestoAiService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      clienteId: [null, Validators.required],
      tipoEvento: [null, Validators.required],
      comentarios: ['']
    });

    this.clienteService.getClientes().subscribe(data => (this.clientes = data));
    this.productoService.obtenerProductos().subscribe(data => (this.productos = data));
  }

  /* ====== TOAST ====== */
  private showToast(msg: string, kind: 'success' | 'error' | 'info' = 'info', ms = 3000) {
    this.toastMensaje = msg;
    this.toastTipo = kind;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toastMensaje = null), ms);
  }

  /* ====== CHAT / IA ====== */
  enviarPromptAI(): void {
    const clienteId = this.form.value.clienteId;
    const tipoEvento = this.form.value.tipoEvento;
    const comentarios = this.form.value.comentarios || '';
    const promptOriginal = (this.prompt || '').trim();

    if (!clienteId || !tipoEvento || !promptOriginal) {
      this.showToast('Completá cliente, tipo de evento y escribí un mensaje.', 'error');
      return;
    }

    const dto = {
      clienteId,
      mensaje: promptOriginal,
      comentarios,
      presupuestoActual: {
        clienteId,
        estado: 'PENDIENTE',
        tipoEvento,
        comentarios,
        gananciaEstimada: 0,
        items: this.items, // lo que ya haya en pantalla
      },
    };

    this.agregarMensajeUsuario(promptOriginal);
    this.prompt = '';
    this.enProceso = true;

    this.presupuestoAiService.generarPresupuestoAI(dto, this.threadId).subscribe({
      next: ({ threadId, payload }) => {
        this.enProceso = false;

        // Guardamos/actualizamos el hilo
        this.threadId = threadId ?? this.threadId;

        // Esperamos: { presupuesto: { items:[{producto, cantidad, precio_unitario, total}], total }, mensaje }
        const itemsIA = (payload?.presupuesto?.items || []) as any[];
        if (!Array.isArray(itemsIA) || itemsIA.length === 0) {
          this.showToast('La IA no devolvió ítems. Probá reformular el pedido.', 'info');
          if (payload?.mensaje) this.agregarMensajeBot(payload.mensaje);
          return;
        }

        // Normalizar nombre → id según catálogo
        const normalizados = itemsIA.map((it: any) => {
          const nombre = it.producto || it.nombre || '';
          const p = this.productos.find(x => x.nombre === nombre);
          const cant = Number(it.cantidad || 1);
          const pu = Number(it.precio_unitario || p?.precioUnitario || 0);
          return {
            productoId: p?.id ?? it.producto_id ?? null,
            cantidad: cant,
            precioUnitario: pu,
            totalItem: Number(it.total ?? cant * pu),
          } as PresupuestoItem;
        });

        this.items = normalizados;
        this.actualizarTotalGlobal();
        this.formularioVisible = true;

        if (payload?.mensaje) this.agregarMensajeBot(payload.mensaje);
      },
      error: (e) => {
        this.enProceso = false;
        this.showToast('No se pudo contactar a la IA: ' + (e?.message ?? ''), 'error');
      },
    });
  }

  /* ====== Guardar en backend ====== */
  crearPresupuesto(): void {
    if (this.form.invalid || this.items.length === 0) {
      this.showToast('Completá los datos y agregá productos con la IA.', 'error');
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
        this.showToast('Presupuesto guardado correctamente.', 'success');
        // 🔑 Cortar memoria: cada presupuesto con su historia
        this.threadId = null;
        this.resetFormulario();
      },
      error: () => this.showToast('No se pudo guardar el presupuesto.', 'error')
    });
  }

  /* ====== Acciones manuales mínimas ====== */
  eliminarItem(index: number): void {
    if (index < 0 || index >= this.items.length) return;
    this.items.splice(index, 1);
    this.actualizarTotalGlobal();
    this.showToast('Ítem removido.', 'info');
  }

  /* ====== Utilidades UI ====== */
  private actualizarTotalGlobal() {
    this.totalGlobal = this.items.reduce((acc, it) => acc + Number(it.totalItem || 0), 0);
  }

  resetFormulario() {
    this.form.reset({ clienteId: null, tipoEvento: null, comentarios: '' });
    this.items = [];
    this.totalGlobal = 0;
    this.formularioVisible = false;
    this.chatMensajes = [{ texto: 'Hola 👋 ¿En qué puedo ayudarte hoy?', tipo: 'bot' }];
    this.prompt = '';
    this.enProceso = false;
    this.threadId = null;
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
      const el = document.querySelector('.chat-mensajes') as HTMLElement | null;
      if (el) el.scrollTop = el.scrollHeight;
    }, 100);
  }
}
