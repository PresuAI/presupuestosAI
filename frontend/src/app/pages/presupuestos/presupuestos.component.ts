import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClienteService, Cliente } from '../../services/cliente.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { PresupuestoItem, PresupuestoRequest } from '../../types/presupuesto';
import { PresupuestoService } from '../../services/presupuesto.service';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextarea } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-presupuestos',
  standalone: true,
  templateUrl: './presupuestos.component.html',
  styleUrls: ['./presupuestos.component.scss'],
  providers: [MessageService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    DropdownModule,
    CardModule,
    InputNumberModule,
    ButtonModule,
    TableModule,
    TagModule,
    ToastModule
  ]
})
export class PresupuestosComponent implements OnInit {
  vista: 'productos' | 'presupuestos' = 'productos';
  formPresupuesto!: FormGroup;
  clientes: Cliente[] = [];
  productos: (Producto & { cantidadTemp: number })[] = [];
  items: PresupuestoItem[] = [];
  presupuestos: any[] = [];
  mostrarFormularioFinal = false;
  carritoAbierto = false;
  presupuestoEditandoId: number | null = null;
  modoEdicion: boolean = false;



  @ViewChild('carritoRef') carritoRef!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private productoService: ProductoService,
    private presupuestoService: PresupuestoService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.formPresupuesto = this.fb.group({
      clienteId: [null, Validators.required],
      estado: ['Propuesta'],
      tipoEvento: ['General'],
      comentarios: [''],
      gananciaEstimada: [0]
    });

    this.clienteService.getClientes().subscribe({
      next: (clientes) => (this.clientes = clientes),
      error: (err) => console.error('Error al obtener clientes', err)
    });
    this.obtenerPresupuestos();
    this.productoService.obtenerProductos().subscribe({
      next: (productos) => {
        this.productos = productos.map(p => ({ ...p, cantidadTemp: 1 }));
      },
      error: (err) => console.error('Error al obtener productos', err)
    });


  }
  cargarPresupuestoParaEditar(pres: any): void {
    this.modoEdicion = true;
    this.presupuestoEditandoId = pres.id;
    this.vista = 'productos';
    this.mostrarFormularioFinal = true;

    this.items = pres.items.map((item: any) => ({
      productoId: item.productoId,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      totalItem: item.totalItem
    }));

    this.formPresupuesto.patchValue({
      clienteId: pres.clienteId,
      estado: pres.estado,
      tipoEvento: pres.tipoEvento,
      comentarios: pres.comentarios,
      gananciaEstimada: pres.gananciaEstimada
    });
  }
  editarPresupuesto(): void {
    if (!this.presupuestoEditandoId || this.formPresupuesto.invalid || this.items.length === 0) return;

    const dto: PresupuestoRequest = {
      clienteId: this.formPresupuesto.value.clienteId,
      estado: this.formPresupuesto.value.estado,
      tipoEvento: this.formPresupuesto.value.tipoEvento,
      comentarios: this.formPresupuesto.value.comentarios,
      gananciaEstimada: this.formPresupuesto.value.gananciaEstimada,
      items: this.items
    };

    this.presupuestoService.actualizarPresupuesto(this.presupuestoEditandoId, dto).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Presupuesto actualizado',
          detail: 'Se editó correctamente el presupuesto.'
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
          detail: 'No se pudo editar el presupuesto.'
        });
      }
    });
  }
  resetFormulario(): void {
    this.formPresupuesto.reset();
    this.items = [];
    this.mostrarFormularioFinal = false;
    this.modoEdicion = false;
    this.presupuestoEditandoId = null;
  }



  obtenerPresupuestos(): void {
    this.presupuestoService.obtenerPresupuestos().subscribe({
      next: (res) => (this.presupuestos = res),
      error: (err) => console.error('Error al obtener presupuestos', err)
    });
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    if (!this.carritoAbierto || !this.carritoRef) return;

    const clickedInside = this.carritoRef.nativeElement.contains(event.target);
    const clickedToggle = (event.target as HTMLElement).closest('.carrito-toggle');

    if (!clickedInside && !clickedToggle) {
      this.carritoAbierto = false;
    }
  }

  agregarProducto(producto: Producto, cantidad: number): void {
    const itemExistente = this.items.find((i) => i.productoId === producto.id);
    if (itemExistente) {
      itemExistente.cantidad += cantidad;
      itemExistente.totalItem = itemExistente.cantidad * itemExistente.precioUnitario;
    } else {
      const item: PresupuestoItem = {
        productoId: producto.id,
        cantidad,
        precioUnitario: producto.precioUnitario,
        totalItem: cantidad * producto.precioUnitario
      };
      this.items.push(item);
    }

    this.carritoAbierto = true;

    this.messageService.add({
      severity: 'success',
      summary: 'Producto agregado',
      detail: `${producto.nombre} x${cantidad}`,
      life: 2000
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
  crearPresupuesto(): void {
    if (this.formPresupuesto.invalid || this.items.length === 0) return;

    const dto: PresupuestoRequest = {
      clienteId: this.formPresupuesto.value.clienteId,
      estado: this.formPresupuesto.value.estado,
      tipoEvento: this.formPresupuesto.value.tipoEvento,
      comentarios: this.formPresupuesto.value.comentarios,
      gananciaEstimada: this.formPresupuesto.value.gananciaEstimada,
      items: this.items
    };

    this.presupuestoService.crearPresupuesto(dto).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Presupuesto creado',
          detail: 'El presupuesto fue registrado correctamente'
        });

        this.formPresupuesto.reset();
        this.items = [];
        this.mostrarFormularioFinal = false;
        this.vista = 'presupuestos';

        this.obtenerPresupuestos();
      },
      error: (err) => {
        console.error('Error al crear presupuesto', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear el presupuesto'
        });
      }
    });
  }
  obtenerTotal(presupuesto: any): number {
    return presupuesto.items?.reduce((acc: number, i: any) => acc + i.totalItem, 0) || 0;
  }


  eliminarPresupuesto(id: number): void {
  if (!confirm('¿Estás seguro de que querés eliminar este presupuesto?')) return;

  this.presupuestoService.eliminarPresupuesto(id).subscribe({
    next: () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Presupuesto eliminado',
        detail: `Se eliminó correctamente el presupuesto ID ${id}`
      });
      this.obtenerPresupuestos();
    },
    error: (err) => {
      console.error('Error al eliminar presupuesto', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo eliminar el presupuesto.'
      });
    }
  });
}


}
