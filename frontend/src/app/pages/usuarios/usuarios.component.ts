import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';
import { environment } from '../../../environments/environment';
import { ChatbotComponent } from '../../shared/chatbot/chatbot.component';

type Rol = 'SUPERADMIN' | 'ADMIN' | 'USUARIO';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ChatbotComponent],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss'],
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];

  creando = false;
  editando = false;
  form!: FormGroup;
  editId: number | null = null;

  rolesDisponibles: Rol[] = [];

  confirmVisible = false;
  usuarioAEliminarId: number | null = null;
  usuarioAEliminar?: { id: number; nombre: string };

  toastMsg: string | null = null;
  toastKind: 'success' | 'error' | 'info' = 'success';
  private toastTimer: any;

  private logoutUrl = `${environment.apiUrlBase}/api/auth/logout`;

  rolActual: Rol = 'USUARIO';
  get isSuperAdmin() {
    return this.rolActual === 'SUPERADMIN';
  }
  get isAdmin() {
    return this.rolActual === 'ADMIN';
  }
  get isUsuario() {
    return this.rolActual === 'USUARIO';
  }

  get canCreate() {
    return this.isSuperAdmin;
  }
  get canEdit() {
    return this.isSuperAdmin || this.isAdmin;
  }
  get canDelete() {
    return this.isSuperAdmin;
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.usuarioService.validarSesion().subscribe({
      next: (s) => {
        const raw = String(s?.rol ?? '').toUpperCase();
        this.rolActual =
          raw === 'SUPERADMIN'
            ? 'SUPERADMIN'
            : raw === 'ADMIN'
            ? 'ADMIN'
            : 'USUARIO';

        this.rolesDisponibles = this.isSuperAdmin
          ? ['SUPERADMIN', 'ADMIN', 'USUARIO']
          : this.isAdmin
          ? ['ADMIN', 'USUARIO']
          : [];

        this.initForm();
        this.cargarUsuarios();
      },
      error: () => {
        this.rolesDisponibles = [];
        this.initForm();
        this.cargarUsuarios();
      },
    });
  }

  private initForm() {
    this.form = this.fb.group({
      nombre: [''],
      email: [''],
      password: [''],
      rol: ['USUARIO'],
      activo: [true],
    });
  }

  cargarUsuarios() {
    this.usuarioService.getUsuarios().subscribe({
      next: (list: Usuario[]) => {
        this.usuarios = list;
      },
      error: () =>
        this.showToast('No se pudieron cargar los usuarios.', 'error'),
    });
  }

  abrirCrear() {
    if (!this.canCreate) return;
    this.creando = true;
    this.editando = false;
    this.editId = null;

    this.form.reset({
      nombre: '',
      email: '',
      password: '',
      rol: 'USUARIO',
      activo: true,
    });
  }

  abrirEditarRol(u: Usuario) {
    if (!this.canEdit) return;
    this.creando = true;
    this.editando = true;
    this.editId = u.id;

    this.form.reset({
      nombre: u.nombre,
      email: u.email,
      password: '',
      rol: u.rol,
      activo: u.activo,
    });
  }

  cancelar() {
    this.creando = false;
    this.editando = false;
    this.editId = null;
    this.form.reset({ activo: true });
  }

  guardar() {
    if (this.editando && this.editId != null) {
      const nuevoRol = this.form.get('rol')?.value as Rol;
      this.usuarioService.actualizarRol(this.editId, nuevoRol).subscribe({
        next: () => {
          const i = this.usuarios.findIndex((u) => u.id === this.editId);
          if (i !== -1)
            this.usuarios[i] = { ...this.usuarios[i], rol: nuevoRol };

          this.showToast('Rol actualizado correctamente.', 'success');
          this.cancelar();
        },
        error: (err) => {
          console.error('[USUARIOS][EDITAR ROL] error', err);
          this.showToast('No se pudo actualizar el rol.', 'error');
        },
      });
      return;
    }

    const nombre = (this.form.get('nombre')?.value || '').trim();
    const email = (this.form.get('email')?.value || '').trim();
    const pass = this.form.get('password')?.value || '';

    if (!nombre) {
      this.showToast('El nombre es obligatorio.', 'error');
      return;
    }
    if (!email) {
      this.showToast('El email es obligatorio.', 'error');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      this.showToast('El email no es válido.', 'error');
      return;
    }
    if (pass.length < 6) {
      this.showToast(
        'La contraseña debe tener al menos 6 caracteres.',
        'error'
      );
      return;
    }

    const dto = {
      nombre: this.form.get('nombre')?.value,
      email: (this.form.get('email')?.value || '').toLowerCase(),
      password: this.form.get('password')?.value,
      rol: this.form.get('rol')?.value,
      activo: this.form.get('activo')?.value,
    };

    this.usuarioService.crearUsuario(dto).subscribe({
      next: (nuevo: Usuario) => {
        this.usuarios.unshift(nuevo);
        this.showToast('Usuario creado correctamente.', 'success');
        this.cancelar();
      },
      error: (err) => {
        const friendly = this.extractBackendMessage(err);
        this.showToast(friendly, 'error');
      },
    });
  }

  pedirEliminar(u: Usuario) {
    if (!this.canDelete) return;
    this.usuarioAEliminarId = u.id;
    this.usuarioAEliminar = { id: u.id, nombre: u.nombre };
    this.confirmVisible = true;
    document.body.style.overflow = 'hidden';
  }

  cerrarConfirm() {
    this.confirmVisible = false;
    this.usuarioAEliminarId = null;
    this.usuarioAEliminar = undefined;
    document.body.style.overflow = '';
  }

  confirmarEliminar() {
    if (!this.canDelete || this.usuarioAEliminarId == null) return;
    const id = this.usuarioAEliminarId;
    this.usuarioService.eliminarUsuario(id).subscribe({
      next: () => {
        this.usuarios = this.usuarios.filter((x) => x.id !== id);
        this.showToast('Usuario eliminado correctamente.', 'success');
        this.cerrarConfirm();
      },
      error: () => this.showToast('No se pudo eliminar el usuario.', 'error'),
    });
  }

  showToast(
    msg: string,
    kind: 'success' | 'error' | 'info' = 'success',
    ms = 3000
  ) {
    this.toastMsg = msg;
    this.toastKind = kind;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toastMsg = null), ms);
  }

  cerrarSesion() {
    fetch(this.logoutUrl, { method: 'POST', credentials: 'include' })
      .then(() => this.router.navigate(['/login']))
      .catch(() => this.showToast('No se pudo cerrar sesión.', 'error'));
  }

  private extractBackendMessage(err: any): string {
    const status = err?.status;

    if (status === 400 || status === 409) {
      return 'Ya existe un usuario registrado con ese email.';
    }

    return 'No se pudo crear el usuario.';
  }
}
