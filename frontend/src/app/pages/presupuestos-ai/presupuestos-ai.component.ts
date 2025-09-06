import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';

import { ClienteService, Cliente } from '../../services/cliente.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { PresupuestoService } from '../../services/presupuesto.service';
import { PresupuestoItem, PresupuestoRequest } from '../../types/presupuesto';
import { PresupuestoAiService } from '../../services/presupuesto-ai.service';

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

  // Presupuesto mostrado (siempre reemplazado por la IA)
  items: PresupuestoItem[] = [];
  totalGlobal = 0;

  // UI
  formularioVisible = false;
  prompt = '';

  // Toast con severidad
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

  // ==== STUBS para compatibilidad con el template (fila "nueva-fila") ====
  // Si no querés altas manuales, podés dejar esta fila en el HTML
  // y estos stubs evitan errores de compilación.
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

  // Si querés impedir altas manuales, dejamos este método como aviso.
  // (Si más adelante querés habilitarlo, podés pushear a this.items y recalcular total).
  agregarItem(): void {
    this.showToast('Para agregar o modificar productos, pedíselo a la IA. Podés borrar con 🗑️.', 'info');
  }
  // ==== /STUBS ====


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

  const TRACE = 'build-' + Math.random().toString(36).slice(2);

  console.groupCollapsed(`%c[AI-BUILD][${TRACE}] DTO de envío`, 'color:#555');
  console.table({
    clienteId,
    tipoEvento,
    prompt_len: promptOriginal.length,
    items_base: this.items.length,
  });
  console.log('Items base:', JSON.parse(JSON.stringify(this.items)));
  console.groupEnd();

  if (!clienteId || !tipoEvento || !promptOriginal) {
    // ... tu validación/Toast existente
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
      items: this.items,
    },
  };

  this.agregarMensajeUsuario(promptOriginal);
  this.prompt = '';

  this.presupuestoAiService.generarPresupuestoAI(dto).subscribe({
    next: (raw) => {
      // Limpieza de ```json ... ``` si aparece
      let body = typeof raw === 'string' ? raw.trim() : String(raw);
      const originalBody = body;
      if (body.startsWith('```json')) body = body.slice(7);
      if (body.endsWith('```')) body = body.slice(0, -3);

      console.groupCollapsed('%c[AI-PARSE] JSON devuelto (raw y limpio)', 'color:#946200');
      console.log('Raw:', originalBody);
      console.log('Clean:', body);
      console.groupEnd();

      let obj: any;
      try {
        obj = JSON.parse(body);
      } catch (e) {
        console.groupCollapsed('%c[AI-PARSE] ✖ Error al parsear JSON', 'color:#c00');
        console.log('Error:', e);
        console.log('Body que falló:', body);
        console.groupEnd();
        // ... tu toast de error
        return;
      }

      // Logs útiles del contenido que vas a usar
      console.groupCollapsed('%c[AI-PARSE] Contenido interpretado', 'color:#0a7');
      console.log('mensaje:', obj?.mensaje);
      console.table({ items_len: obj?.presupuesto?.items?.length ?? 0, total: obj?.presupuesto?.total });
      console.log('items ejemplo (primeros 3):', (obj?.presupuesto?.items || []).slice(0, 3));
      console.groupEnd();

      // ⬇️ Aquí mantenés tu estrategia de “reemplazar y listo”
      const itemsIA = (obj?.presupuesto?.items || []) as any[];
      if (!Array.isArray(itemsIA) || itemsIA.length === 0) {
        // ... tu toast si viene vacío
        return;
      }

      // Normalización simple por nombre → id (si tenés catálogo)
      const normalizados = itemsIA.map((it: any) => {
        const nombre = it.producto || it.nombre || '';
        const p = this.productos.find((x) => x.nombre === nombre);
        const cant = Number(it.cantidad || 1);
        const pu = Number(it.precio_unitario || p?.precioUnitario || 0);
        return {
          productoId: p?.id ?? it.producto_id ?? null,
          cantidad: cant,
          precioUnitario: pu,
          totalItem: Number(it.total ?? cant * pu),
        };
      });

      console.groupCollapsed('%c[AI-APPLY] Se reemplaza presupuesto', 'color:#07a');
      console.log('items_normalizados:', normalizados);
      console.groupEnd();

      this.items = normalizados;
      this.actualizarTotalGlobal();
      this.formularioVisible = true;

      if (obj?.mensaje) this.agregarMensajeBot(obj.mensaje);
    },
    error: (err) => {
      // Ya logueado en el service; podés agregar toast acá si querés.
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
        this.resetFormulario();
      },
      error: () => this.showToast('No se pudo guardar el presupuesto.', 'error')
    });
  }

  /* ====== Acciones manuales mínimas (borrado) ====== */
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
