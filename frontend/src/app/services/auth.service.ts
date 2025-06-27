import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Usuario {
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

  private baseUrl = `${environment.usuarioApi}/usuarios`;

  constructor(private http: HttpClient) { }

  cargarUsuario(): Observable<Usuario> {
    return this.http
      .get<Usuario>(`${this.baseUrl}/me`, { withCredentials: true })
      .pipe(
        tap(usuario => this.usuarioActualSubject.next(usuario))
      );
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
