import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http'; // <-- ¡Este es el que faltaba!
import { UsuarioService } from '../../services/usuario.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';



@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, HttpClientModule], // <-- Asegurate que esté aquí
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss']
})
export class UsuariosComponent implements OnInit {
  usuarios: any[] = [];
 
  constructor(
  private usuarioService: UsuarioService,
  private http: HttpClient,
  private router: Router
) {}

  ngOnInit(): void {
    console.log('ngOnInit ejecutado');
    this.usuarioService.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        console.log('Usuarios recibidos:', this.usuarios);
      },
      error: (err) => {
        console.error('Error al obtener usuarios:', err);
      }
    });
  }

cerrarSesion(): void {
  this.http.post('http://localhost:8080/api/auth/logout', {}, {
    withCredentials: true
  }).subscribe({
    next: () => {
      this.router.navigate(['/login']);
    },
    error: (err: any) => {
      console.error('Error al cerrar sesión', err);
    }
  });
}

eliminarUsuario(id: number): void {
  if (confirm('¿Estás seguro de que querés eliminar este usuario?')) {
    this.usuarioService.eliminarUsuario(id).subscribe({
      next: () => {
        this.usuarios = this.usuarios.filter(u => u.id !== id);
      },
      error: err => {
        console.error('Error al eliminar usuario', err);
      }
    });
  }
}

editarRol(usuario: any): void {
  const nuevoRol = prompt('Nuevo rol (ADMIN o USUARIO):', usuario.rol);
  if (nuevoRol && nuevoRol !== usuario.rol) {
    this.usuarioService.actualizarRol(usuario.id, nuevoRol).subscribe({
      next: () => {
        usuario.rol = nuevoRol; // actualizamos en memoria también
        console.log('Rol actualizado');
      },
      error: err => {
        console.error('Error al actualizar rol', err);
      }
    });
  }
}

}
