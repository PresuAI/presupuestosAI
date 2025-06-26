import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../services/auth.service';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    TagModule,
    CheckboxModule
  ],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss']
})
export class UsuariosComponent implements OnInit {
  usuarios: any[] = [];
  puedeCrear: boolean = false;
  creando: boolean = false;
  formulario!: FormGroup;
  rolesDisponibles: string[] = [];

  @ViewChild('formularioCrear') formularioCrearRef!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private usuarioService: UsuarioService,
    public authService: AuthService
  ) {
    this.formulario = this.fb.group({
      nombre: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-ZÁÉÍÓÚáéíóúñÑ\s]+$/)
      ]],
      email: ['', [Validators.required, Validators.email]],
      rol: ['', Validators.required],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.authService.cargarUsuario().subscribe({
      next: () => {
        this.puedeCrear = this.authService.puedeCrearUsuarios();
        this.cargarUsuarios();
      },
      error: () => {
        console.error('🔒 No autenticado. Redirigiendo...');
        this.router.navigate(['/login']);
      }
    });
  }

  cargarUsuarios(): void {
    this.usuarioService.getUsuarios().subscribe({
      next: (data) => this.usuarios = data,
      error: (err) => console.error('Error al obtener usuarios:', err)
    });
  }

  abrirFormularioCrearUsuario(): void {
    this.creando = true;
    this.rolesDisponibles = this.authService.getRolesDisponiblesParaCrear();
    setTimeout(() => {
      this.formularioCrearRef?.nativeElement.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  cancelarCreacion(): void {
    this.creando = false;
    this.formulario.reset({ activo: true });
  }

  crearUsuario(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.usuarioService.crearUsuario(this.formulario.value).subscribe({
      next: (nuevo) => {
        this.usuarios.push(nuevo);
        this.creando = false;
        this.formulario.reset({ activo: true });
        alert('✅ Usuario creado exitosamente');
      },
      error: (err) => {
        console.error('Error al crear usuario', err);
        alert('❌ Error al crear usuario: ' + (err.error?.message || 'Error desconocido'));
      }
    });
  }

  editarRol(usuario: any): void {
    const nuevoRol = prompt('Nuevo rol (ADMIN, USUARIO o SUPERADMIN):', usuario.rol);
    if (nuevoRol && nuevoRol !== usuario.rol) {
      this.usuarioService.actualizarRol(usuario.id, nuevoRol).subscribe({
        next: () => usuario.rol = nuevoRol,
        error: err => console.error('Error al actualizar rol', err)
      });
    }
  }

  eliminarUsuario(id: number): void {
    if (confirm('¿Estás seguro de que querés eliminar este usuario?')) {
      this.usuarioService.eliminarUsuario(id).subscribe({
        next: () => this.usuarios = this.usuarios.filter(u => u.id !== id),
        error: err => console.error('Error al eliminar usuario', err)
      });
    }
  }

  cerrarSesion(): void {
    this.http.post('http://localhost:8080/api/auth/logout', {}, { withCredentials: true }).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (err: any) => console.error('Error al cerrar sesión', err)
    });
  }
}
