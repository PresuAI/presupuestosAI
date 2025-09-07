import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
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
      rut: ['', [Validators.required, rutFlexibleValidator]],           // NUEVO
      nombre: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, telefonoValidator]],         // NUEVO
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

  // ===== Helpers de error (no cambian la UI, sólo muestran toasts) =====
  private mostrarErroresDeFormulario(): void {
    this.formulario.markAllAsTouched();
    const errores: string[] = [];

    const f = this.formulario.controls;

    if (f['rut']?.errors) {
      if (f['rut'].errors['required']) errores.push('RUT es obligatorio.');
      if (f['rut'].errors['rutFormato'])
        errores.push('RUT no tiene un formato válido.');
    }

    if (f['nombre']?.errors) {
      if (f['nombre'].errors['required']) errores.push('Nombre es obligatorio.');
    }

    if (f['email']?.errors) {
      if (f['email'].errors['required']) errores.push('Email es obligatorio.');
      if (f['email'].errors['email'])
        errores.push('Email no tiene un formato válido.');
    }

    if (f['telefono']?.errors) {
      if (f['telefono'].errors['required'])
        errores.push('Teléfono es obligatorio.');
      if (f['telefono'].errors['telefonoFormato'])
        errores.push('Teléfono debe tener entre 7 y 15 dígitos (sólo números, +, espacios o guiones).');
    }

    // Un único toast en rojo con el detalle (sin tocar estilos existentes)
    this.messageService.add({
      severity: 'error',
      summary: 'Datos incompletos o inválidos',
      detail: errores.join(' '),
      life: 5000,
    });
  }

  crearCliente(): void {
    const dto = this.formulario.value;

    // Permitimos enviar SIEMPRE, pero si hay errores mostramos toasts y no llamamos al backend
    if (this.formulario.invalid) {
      this.mostrarErroresDeFormulario();
      return;
    }

    if (this.clienteEditando) {
      const clienteActualizado = {
        ...this.clienteEditando,
        nombre: dto.nombre,
        email: dto.email,
        telefono: dto.telefono,
        activo: dto.activo,
        rut: dto.rut,
      };

      this.clienteService.actualizarCliente(this.clienteEditando.id, clienteActualizado).subscribe({
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
            detail: err?.error || 'No se pudo actualizar el cliente',
          });
        },
      });

    } else {
      this.clienteService.crearCliente(dto).subscribe({
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
          // Mostramos mensaje backend (duplicado RUT/email, etc.) en rojo
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error || 'No se pudo crear el cliente',
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
    if (!this.clienteEditandoId) return;

    const dto = this.formulario.value;

    // Igual que en crear: permitimos submit, pero si hay errores, los mostramos
    if (this.formulario.invalid) {
      this.mostrarErroresDeFormulario();
      return;
    }

    this.clienteService.actualizarCliente(this.clienteEditandoId, dto).subscribe({
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
          detail: err?.error || 'No se pudo actualizar el cliente.',
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
        this.clientes = this.clientes.filter((c) => c.id !== id);
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: 'Cliente eliminado correctamente',
        });
        this.cerrarConfirm();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar el cliente',
        });
      },
    });
  }
}

/* =======================
   VALIDADORES PERSONALIZADOS
   ======================= */

/**
 * RUT flexible para no romper flujos:
 * - Acepta:
 *   - 12 dígitos (RUT/Uruguay empresas: 12 números)
 *   - o 7-8 dígitos + '-' + dígito/K (formato RUT Chile)
 *   - Se permiten puntos opcionales (se ignoran para validar).
 */
export function rutFlexibleValidator(control: AbstractControl): ValidationErrors | null {
  const raw = (control.value || '').toString().trim();
  if (!raw) return null; // required lo maneja Validators.required

  const limpio = raw.replace(/\./g, '');
  const chPattern = /^\d{7,8}-[\dkK]$/;
  const uyPattern = /^\d{12}$/;

  if (chPattern.test(limpio) || uyPattern.test(limpio)) return null;

  return { rutFormato: true };
}

/**
 * Teléfono: permite +, espacios y guiones, pero exige entre 7 y 15 dígitos en total.
 */
export function telefonoValidator(control: AbstractControl): ValidationErrors | null {
  const raw = (control.value || '').toString().trim();
  if (!raw) return null; // required lo maneja Validators.required

  const digits = raw.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return { telefonoFormato: true };

  // además, sólo permitir caracteres validos (dígitos, +, espacios, guiones, paréntesis)
  const validChars = /^[0-9+\-\s()]+$/;
  if (!validChars.test(raw)) return { telefonoFormato: true };

  return null;
}
