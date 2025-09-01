import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ClienteService, Cliente } from '../../services/cliente.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { PresupuestoItem, PresupuestoRequest } from '../../types/presupuesto';
import { PresupuestoService } from '../../services/presupuesto.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-presupuestos',
  standalone: true,
  templateUrl: './presupuestos.component.html',
  styleUrls: ['./presupuestos.component.scss'],
  providers: [MessageService],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ToastModule],
})
export class PresupuestosComponent implements OnInit {
  // Vistas
  vista: 'productos' | 'presupuestos' = 'productos';
  mostrarFormularioFinal = false;
  carritoAbierto = false;

  // Datos
  clientes: Cliente[] = [];
  productos: (Producto & { cantidadTemp: number })[] = [];
  items: PresupuestoItem[] = [];
  presupuestos: any[] = [];

  // Edición
  presupuestoEditandoId: number | null = null;
  modoEdicion = false;

  // Form
  formPresupuesto!: FormGroup;

  // Selects
  estados = [
    { value: 'PROPUESTO', label: 'Propuesto' },
    { value: 'APROBADO', label: 'Aprobado' },
    { value: 'RECHAZADO', label: 'Rechazado' },
  ];

  tiposEvento = [
    { value: 'Cumpleaños', label: 'Cumpleaños' },
    { value: 'Casamiento', label: 'Casamiento' },
    { value: 'Corporativo', label: 'Corporativo' },
  ];

  @ViewChild('carritoRef') carritoRef!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private productoService: ProductoService,
    private presupuestoService: PresupuestoService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.buildForm();

    this.clienteService.getClientes().subscribe({
      next: (clientes) => (this.clientes = clientes),
      error: (err) => console.error('Error al obtener clientes', err),
    });

    this.productoService.obtenerProductos().subscribe({
      next: (productos) =>
        (this.productos = productos.map((p) => ({ ...p, cantidadTemp: 1 }))),
      error: (err) => console.error('Error al obtener productos', err),
    });

    this.obtenerPresupuestos();
  }

  /* ===== Helpers de form ===== */
  private buildForm(): void {
    this.formPresupuesto = this.fb.group({
      clienteId: [null, Validators.required],
      estado: [null, Validators.required],
      tipoEvento: [null, Validators.required],
      comentarios: [''],
      gananciaEstimada: [0, [Validators.min(0)]],
    });
  }

  private normalizeEstado(valor: string | null | undefined): string | null {
    if (!valor) return null;
    const v = valor.toLowerCase();
    if (v.includes('propu')) return 'PROPUESTO';
    if (v.includes('aprob')) return 'APROBADO';
    if (v.includes('rech')) return 'RECHAZADO';
    return valor as string;
  }

  /** Para selects: compara por string y evita mismatch string vs number */
  compareByString = (a: any, b: any) => `${a}` === `${b}`;

  /* ===== Carga / edición ===== */
  cargarPresupuestoParaEditar(pres: any): void {
    this.modoEdicion = true;
    this.presupuestoEditandoId = pres.id;
    this.vista = 'productos';
    this.mostrarFormularioFinal = true;
    this.carritoAbierto = false; // que no tape el form

    // Items del presupuesto
    this.items = (pres.items || []).map((item: any) => ({
      productoId: +item.productoId,
      cantidad: +item.cantidad,
      precioUnitario: +item.precioUnitario,
      totalItem: +item.totalItem,
    }));

    // Normalizar valores para los selects y numéricos
    const clienteId = pres.clienteId != null ? +pres.clienteId : null;
    const estado = this.normalizeEstado(pres.estado) ?? null;
    const tipoEventoRaw = pres.tipoEvento ?? null;
    const tipoEvento = this.tiposEvento.some((t) => t.value === tipoEventoRaw)
      ? tipoEventoRaw
      : null;
    const ganancia =
      pres.gananciaEstimada != null ? Number(pres.gananciaEstimada) : 0;

    // Precargar form
    this.formPresupuesto.patchValue({
      clienteId,
      estado,
      tipoEvento,
      comentarios: pres.comentarios ?? '',
      gananciaEstimada: ganancia,
    });

    // Llevar al usuario al form
    setTimeout(() => {
      document
        .getElementById('form-presupuesto-top')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  editarPresupuesto(): void {
    if (
      !this.presupuestoEditandoId ||
      this.formPresupuesto.invalid ||
      this.items.length === 0
    )
      return;

    const dto: PresupuestoRequest = {
      clienteId: this.formPresupuesto.value.clienteId,
      estado: this.formPresupuesto.value.estado,
      tipoEvento: this.formPresupuesto.value.tipoEvento,
      comentarios: this.formPresupuesto.value.comentarios,
      gananciaEstimada: this.formPresupuesto.value.gananciaEstimada,
      items: this.items,
    };

    this.presupuestoService
      .actualizarPresupuesto(this.presupuestoEditandoId, dto)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Presupuesto actualizado',
            detail: 'Se editó correctamente el presupuesto.',
          });
          this.resetFormulario();
          this.obtenerPresupuestos();
          this.vista = 'presupuestos';
        },
        error: (err) => {
          console.error('Error al editar presupuesto', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo editar el presupuesto.',
          });
        },
      });
  }

  crearPresupuesto(): void {
    if (this.formPresupuesto.invalid || this.items.length === 0) return;

    const dto: PresupuestoRequest = {
      clienteId: this.formPresupuesto.value.clienteId,
      estado: this.formPresupuesto.value.estado,
      tipoEvento: this.formPresupuesto.value.tipoEvento,
      comentarios: this.formPresupuesto.value.comentarios,
      gananciaEstimada: this.formPresupuesto.value.gananciaEstimada,
      items: this.items,
    };

    this.presupuestoService.crearPresupuesto(dto).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Presupuesto creado',
          detail: 'El presupuesto fue registrado correctamente',
        });
        this.resetFormulario();
        this.vista = 'presupuestos';
        this.obtenerPresupuestos();
      },
      error: (err) => {
        console.error('Error al crear presupuesto', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear el presupuesto',
        });
      },
    });
  }

  resetFormulario(): void {
    this.buildForm();
    this.items = [];
    this.mostrarFormularioFinal = false;
    this.modoEdicion = false;
    this.presupuestoEditandoId = null;
  }

  /* ===== Listado ===== */
  obtenerPresupuestos(): void {
    this.presupuestoService.obtenerPresupuestos().subscribe({
      next: (res) => (this.presupuestos = res),
      error: (err) => console.error('Error al obtener presupuestos', err),
    });
  }

  obtenerTotal(presupuesto: any): number {
    return (
      presupuesto.items?.reduce(
        (acc: number, i: any) => acc + i.totalItem,
        0
      ) || 0
    );
  }

  eliminarPresupuesto(id: number): void {
    if (!confirm('¿Estás seguro de que querés eliminar este presupuesto?'))
      return;

    this.presupuestoService.eliminarPresupuesto(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Presupuesto eliminado',
          detail: `Se eliminó correctamente el presupuesto ID ${id}`,
        });
        this.obtenerPresupuestos();
      },
      error: (err) => {
        console.error('Error al eliminar presupuesto', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar el presupuesto.',
        });
      },
    });
  }

  /* ===== Carrito ===== */
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    if (!this.carritoAbierto || !this.carritoRef) return;
    const clickedInside = this.carritoRef.nativeElement.contains(event.target);
    const clickedToggle = (event.target as HTMLElement).closest(
      '.carrito-toggle'
    );
    if (!clickedInside && !clickedToggle) this.carritoAbierto = false;
  }

  agregarProducto(producto: Producto, cantidad: number): void {
    const itemExistente = this.items.find((i) => i.productoId === producto.id);
    if (itemExistente) {
      itemExistente.cantidad += cantidad;
      itemExistente.totalItem =
        itemExistente.cantidad * itemExistente.precioUnitario;
    } else {
      const item: PresupuestoItem = {
        productoId: producto.id,
        cantidad,
        precioUnitario: producto.precioUnitario,
        totalItem: cantidad * producto.precioUnitario,
      };
      this.items.push(item);
    }

    this.carritoAbierto = true;
    this.messageService.add({
      severity: 'success',
      summary: 'Producto agregado',
      detail: `${producto.nombre} x${cantidad}`,
      life: 2000,
    });
  }

  eliminarItem(index: number): void {
    this.items.splice(index, 1);
  }

  continuar(): void {
    this.mostrarFormularioFinal = true;
  }
  volver(): void {
    this.mostrarFormularioFinal = false;
  }

  // helpers del carrito
  toggleCarrito(): void { this.carritoAbierto = !this.carritoAbierto; }
  openCarrito(): void { this.carritoAbierto = true; }
  closeCarrito(): void { this.carritoAbierto = false; }
}
