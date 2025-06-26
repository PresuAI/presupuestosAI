import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

interface Usuario {
  email: string;
  nombre: string;
  rol: 'USUARIO' | 'ADMIN' | 'SUPERADMIN';
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usuarioActualSubject = new BehaviorSubject<Usuario | null>(null);
  usuarioActual$ = this.usuarioActualSubject.asObservable();

  constructor(private http: HttpClient) {}

  cargarUsuario(): Observable<Usuario> {
    return new Observable(observer => {
      this.http.get<Usuario>('http://localhost:8080/api/usuarios/me', { withCredentials: true })
        .subscribe({
          next: (usuario) => {
            this.usuarioActualSubject.next(usuario);
            observer.next(usuario);
            observer.complete();
          },
          error: (err) => {
            console.error('Error al cargar usuario autenticado', err);
            observer.error(err);
          }
        });
    });
  }

  getUsuario(): Usuario | null {
    return this.usuarioActualSubject.getValue();
  }

  puedeCrearUsuarios(): boolean {
    const rol = this.getUsuario()?.rol;
    return rol === 'ADMIN' || rol === 'SUPERADMIN';
  }

  getRolesDisponiblesParaCrear(): string[] {
    const rol = this.getUsuario()?.rol;
    if (rol === 'SUPERADMIN') return ['ADMIN', 'USUARIO'];
    if (rol === 'ADMIN') return ['USUARIO'];
    return [];
  }
}
