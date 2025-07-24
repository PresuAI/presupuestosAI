import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClienteService, Cliente } from '../../services/cliente.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { PresupuestoService } from '../../services/presupuesto.service';
import { PresupuestoItem, PresupuestoRequest } from '../../types/presupuesto';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextarea } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-presupuestos-ai',
  standalone: true,
  templateUrl: './presupuestos-ai.component.html',
  styleUrls: ['./presupuestos-ai.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    DropdownModule,
    InputTextarea,
    InputNumberModule,
    ButtonModule,
    TableModule,
    ToastModule,
    CardModule,
  ],
  providers: [MessageService]
})
export class PresupuestosAiComponent implements OnInit {
  form!: FormGroup;
  clientes: Cliente[] = [];
  productos: Producto[] = [];
  items: PresupuestoItem[] = [];
  nuevoItem: PresupuestoItem = { productoId: null, cantidad: 1, precioUnitario: 0, totalItem: 0 };
  prompt: string = '';
  totalGlobal: number = 0;

  tiposEvento = [
    { label: 'Cumpleaños', value: 'Cumpleaños' },
    { label: 'Casamiento', value: 'Casamiento' },
    { label: 'Corporativo', value: 'Corporativo' }
  ];

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private productoService: ProductoService,
    private messageService: MessageService,
    private presupuestoService: PresupuestoService
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      clienteId: [null, Validators.required],
      tipoEvento: ['', Validators.required],
      comentarios: ['']
    });

    this.clienteService.getClientes().subscribe({ next: data => (this.clientes = data) });
    this.productoService.obtenerProductos().subscribe({ next: data => (this.productos = data) });
  }

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
    const total = this.items.reduce((acc, item) => acc + item.totalItem, 0) + this.nuevoItem.totalItem;
    this.totalGlobal = total;
  }

  agregarItem() {
    if (!this.nuevoItem.productoId || this.nuevoItem.cantidad <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'Seleccioná un producto y cantidad válida.'
      });
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

    this.nuevoItem = { productoId: null, cantidad: 1, precioUnitario: 0, totalItem: 0 };
    this.actualizarTotalGlobal();

    this.messageService.add({
      severity: 'success',
      summary: 'Producto agregado',
      detail: `${producto.nombre} x${this.nuevoItem.cantidad}`
    });
  }

  eliminarItem(index: number): void {
    this.items.splice(index, 1);
    this.actualizarTotalGlobal();
    this.messageService.add({ severity: 'info', summary: 'Eliminado', detail: 'Ítem removido.' });
  }

  crearPresupuesto(): void {
    if (this.form.invalid || this.items.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: 'Completá los datos y agrega al menos un producto.'
      });
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

    this.presupuestoService.crearPresupuesto(dto).subscribe(() => {
      this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Presupuesto creado correctamente.' });
      this.form.reset();
      this.items = [];
      this.totalGlobal = 0;
    });
  }

  enviarPromptAI(): void {
    console.log('Enviar datos a AI:', this.items);
  }
}
