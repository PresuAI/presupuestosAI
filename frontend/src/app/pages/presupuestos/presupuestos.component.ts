import { Component, OnInit } from '@angular/core';
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
import { SidebarModule } from 'primeng/sidebar';

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
    ToastModule,
    SidebarModule
  ]
})
export class PresupuestosComponent implements OnInit {
  formPresupuesto!: FormGroup;
  clientes: Cliente[] = [];
  productos: (Producto & { cantidadTemp: number })[] = []; // ← Cambio aplicado acá
  items: PresupuestoItem[] = [];
  mostrarFormulario = false;
  mostrarFormularioFinal = false;
  mostrarSidebar: boolean = false;

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private productoService: ProductoService,
    private presupuestoService: PresupuestoService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.formPresupuesto = this.fb.group({
      clienteId: [null, Validators.required],
      estado: ['Propuesta'],
      tipoEvento: ['General'],
      comentarios: [''],
      gananciaEstimada: [0]
    });

    this.clienteService.getClientes().subscribe({
      next: (clientes) => this.clientes = clientes,
      error: (err) => console.error('Error al obtener clientes', err)
    });

    this.productoService.obtenerProductos().subscribe({
      next: (productos) => {
        this.productos = productos.map(p => ({ ...p, cantidadTemp: 1 }));
      },
      error: (err) => console.error('Error al obtener productos', err)
    });
  }

  agregarProducto(producto: Producto, cantidad: number): void {
    const itemExistente = this.items.find(i => i.productoId === producto.id);
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
        this.mostrarFormulario = false;
        this.mostrarFormularioFinal = false;
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
}
