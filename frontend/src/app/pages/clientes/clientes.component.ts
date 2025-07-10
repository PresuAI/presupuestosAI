import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ClienteService } from '../../services/cliente.service';
import { AuthService } from '../../services/auth.service';
import { ChatbotComponent } from '../../shared/chatbot/chatbot.component';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule,
    CardModule,
    TagModule,
    ChatbotComponent,
  ],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.scss']
})
export class ClientesComponent implements OnInit {
  clientes: any[] = [];
  creando = false;
  formulario: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private clienteService: ClienteService,
    public authService: AuthService
  ) {
    this.formulario = this.fb.group({
      rut: ['', Validators.required],
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.clienteService.getClientes().subscribe({
      next: data => this.clientes = data,
      error: err => console.error('Error al obtener clientes:', err)
    });
  }

  abrirFormularioCrear(): void {
    this.creando = true;
  }

  cancelarCreacion(): void {
    this.creando = false;
    this.formulario.reset({ activo: true });
  }

  crearCliente(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.clienteService.crearCliente(this.formulario.value).subscribe({
      next: nuevo => {
        this.clientes.push(nuevo);
        this.creando = false;
        this.formulario.reset({ activo: true });
        alert('✅ Cliente creado exitosamente');
      },
      error: err => {
        console.error('Error al crear cliente', err);
        alert('❌ Error al crear cliente: ' + (err.error?.message || 'Error desconocido'));
      }
    });
  }

  eliminarCliente(id: number): void {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      this.clienteService.eliminarCliente(id).subscribe({
        next: () => this.clientes = this.clientes.filter(c => c.id !== id),
        error: err => console.error('Error al eliminar cliente', err)
      });
    }
  }
}
