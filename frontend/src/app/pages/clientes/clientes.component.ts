import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

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
    ConfirmDialogModule,
    ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.scss'],
})
export class ClientesComponent implements OnInit {
  clientes: any[] = [];
  creando = false;
  formulario: FormGroup;
  clienteEditando: any = null;
  confirmVisible = false;
  clienteAEliminar?: { id: number; nombre: string };

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private clienteService: ClienteService,
    public authService: AuthService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
    this.formulario = this.fb.group({
      rut: ['', Validators.required],
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      activo: [true],
    });
  }
  editando = false;
  clienteEditandoId: number | null = null;

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.clienteService.getClientes().subscribe({
      next: (data) => (this.clientes = data),
      error: (err) => console.error('Error al obtener clientes:', err),
    });
  }

  abrirFormularioCrear(): void {
    this.creando = true;
    this.clienteEditando = null;
    this.formulario.reset({ activo: true });
  }

  cancelarCreacion(): void {
    this.creando = false;
    this.editando = false;
    this.clienteEditando = null;
    this.clienteEditandoId = null;
    this.formulario.reset({ activo: true });
  }

  crearCliente(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const clienteForm = this.formulario.value;

    if (this.clienteEditando) {
      const clienteActualizado = {
        ...this.clienteEditando,
        nombre: clienteForm.nombre,
        email: clienteForm.email,
        telefono: clienteForm.telefono,
        activo: clienteForm.activo,
      };

      this.clienteService
        .actualizarCliente(this.clienteEditando.id, clienteActualizado)
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Cliente actualizado',
              detail: 'Los datos fueron guardados correctamente',
            });
            this.cargarClientes();
            this.cancelarCreacion();
          },
          error: (err) => {
            console.error('Error al actualizar cliente', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo actualizar el cliente',
            });
          },
        });
    } else {
      this.clienteService.crearCliente(clienteForm).subscribe({
        next: (nuevo) => {
          this.clientes.push(nuevo);
          this.messageService.add({
            severity: 'success',
            summary: 'Cliente creado',
            detail: 'El cliente fue registrado exitosamente',
          });
          this.cancelarCreacion();
        },
        error: (err) => {
          console.error('Error al crear cliente', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear el cliente',
          });
        },
      });
    }
  }

  editarCliente(cliente: any): void {
    this.clienteEditando = cliente;
    this.editando = true;
    this.creando = true;
    this.clienteEditandoId = cliente.id;
    this.formulario.patchValue({
      rut: cliente.rut,
      nombre: cliente.nombre,
      email: cliente.email,
      telefono: cliente.telefono,
      activo: cliente.activo,
    });
  }

  eliminarCliente(id: number): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de eliminar este cliente?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        this.clienteService.eliminarCliente(id).subscribe({
          next: () => {
            this.clientes = this.clientes.filter((c) => c.id !== id);
            this.messageService.add({
              severity: 'success',
              summary: 'Eliminado',
              detail: 'Cliente eliminado correctamente',
            });
          },
          error: (err) => {
            console.error('Error al eliminar cliente', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar el cliente',
            });
          },
        });
      },
    });
  }
  actualizarCliente(): void {
    if (this.formulario.invalid || !this.clienteEditandoId) return;

    const dto = this.formulario.value;

    this.clienteService
      .actualizarCliente(this.clienteEditandoId, dto)
      .subscribe({
        next: (actualizado) => {
          const index = this.clientes.findIndex((c) => c.id === actualizado.id);
          if (index !== -1) this.clientes[index] = actualizado;

          this.creando = false;
          this.editando = false;
          this.clienteEditandoId = null;
          this.formulario.reset({ activo: true });

          this.messageService.add({
            severity: 'success',
            summary: 'Cliente actualizado',
            detail: 'Los cambios fueron guardados.',
          });
        },
        error: (err) => {
          console.error('Error al actualizar cliente', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar el cliente.',
          });
        },
      });
  }
  pedirEliminar(cliente: any): void {
  this.clienteAEliminar = { id: cliente.id, nombre: cliente.nombre };
  this.confirmVisible = true;
  document.body.style.overflow = 'hidden';
}

cerrarConfirm(): void {
  this.confirmVisible = false;
  this.clienteAEliminar = undefined;
  document.body.style.overflow = '';
}

confirmarEliminar(): void {
  if (!this.clienteAEliminar) return;
  const id = this.clienteAEliminar.id;
  this.clienteService.eliminarCliente(id).subscribe({
    next: () => {
      this.clientes = this.clientes.filter(c => c.id !== id);
      this.messageService.add({
        severity: 'success',
        summary: 'Eliminado',
        detail: 'Cliente eliminado correctamente'
      });
      this.cerrarConfirm();
    },
    error: () => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo eliminar el cliente'
      });
    }
  });
}
}
