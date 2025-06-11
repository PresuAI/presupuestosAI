import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http'; // <-- ¡Este es el que faltaba!
import { UsuarioService } from '../../services/usuario.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, HttpClientModule], // <-- Asegurate que esté aquí
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss']
})
export class UsuariosComponent implements OnInit {
  usuarios: any[] = [];

  constructor(private usuarioService: UsuarioService,private router: Router) {}

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
  // 🔐 Borra la cookie del lado del cliente (opcional si es HttpOnly)
  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

  // 🔁 Redirigir al login
  this.router.navigate(['/login']);
}
}
