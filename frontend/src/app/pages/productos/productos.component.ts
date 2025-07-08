import { Component, OnInit } from '@angular/core';
import { ProductoService, Producto } from '../../services/producto.service';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToolbarModule } from 'primeng/toolbar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { PanelModule } from 'primeng/panel';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TagModule,
    DialogModule,
    ButtonModule,
    FormsModule,
    ReactiveFormsModule,
    InputNumberModule,
    ToolbarModule,
    InputTextModule,
    DropdownModule,
    PanelModule,
    CheckboxModule,
    ToastModule
  ],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.scss'],
  providers: [MessageService]
})
export class ProductosComponent implements OnInit {
  productos: Producto[] = [];
  productoSeleccionado?: Producto;
  modalVisible = false;
  nuevoPrecio?: number;
  filtro: string = '';
  ordenSeleccionado: string | null = null;
  formularioProducto!: FormGroup;
  panelVisible: boolean = false;

  opcionesOrden = [
    { label: 'Precio ascendente', value: 'asc' },
    { label: 'Precio descendente', value: 'desc' }
  ];

  constructor(
    private productoService: ProductoService,
    public authService: AuthService,
    private fb: FormBuilder,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.obtenerProductos();

    this.formularioProducto = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      ingredientes: ['', Validators.required],
      precioUnitario: [null, [Validators.required, Validators.min(1)]],
      esVegano: [false],
      esVegetariano: [false]
    });
  }

  get productosFiltrados(): Producto[] {
    let filtrados = this.productos.filter(p =>
      p.nombre.toLowerCase().includes(this.filtro.toLowerCase()) ||
      p.descripcion?.toLowerCase().includes(this.filtro.toLowerCase())
    );

    if (this.ordenSeleccionado === 'asc') {
      filtrados.sort((a, b) => a.precioUnitario - b.precioUnitario);
    } else if (this.ordenSeleccionado === 'desc') {
      filtrados.sort((a, b) => b.precioUnitario - a.precioUnitario);
    }

    return filtrados;
  }

  obtenerProductos() {
    this.productoService.obtenerProductos().subscribe({
      next: (data) => (this.productos = data),
      error: (err) => console.error('Error al obtener productos', err)
    });
  }

  abrirModal(producto: Producto) {
    this.productoSeleccionado = { ...producto };
    this.nuevoPrecio = producto.precioUnitario;
    this.modalVisible = true;
  }

  actualizarPrecio() {
    if (!this.productoSeleccionado || this.nuevoPrecio == null) return;

    const actualizado = {
      ...this.productoSeleccionado,
      precioUnitario: this.nuevoPrecio
    };

    this.productoService.actualizarProducto(this.productoSeleccionado.id, actualizado).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Precio actualizado',
          detail: `Se actualizó correctamente el precio de "${actualizado.nombre}".`
        });
        this.modalVisible = false;
        this.obtenerProductos();
      },
      error: (err) => {
        console.error('Error al actualizar', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al actualizar precio',
          detail: err.error?.message || 'No se pudo actualizar el precio.'
        });
      }
    });
  }

  crearProducto(): void {
    if (this.formularioProducto.invalid) return;

    const nuevoProducto = this.formularioProducto.value;

    this.productoService.crearProducto(nuevoProducto).subscribe({
      next: (producto) => {
        this.productos.push(producto);
        this.messageService.add({
          severity: 'success',
          summary: 'Producto creado',
          detail: `Se creó correctamente el producto "${producto.nombre}".`
        });
        this.formularioProducto.reset();
      },
      error: (err) => {
        console.error('Error al crear producto', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al crear',
          detail: err.error?.message || 'No se pudo crear el producto.'
        });
      }
    });
  }

  abrirFormularioProducto() {
    this.panelVisible = !this.panelVisible;
  }
}
