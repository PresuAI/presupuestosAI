import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private base = environment.usuarioApi;

  constructor(private http: HttpClient) {}

  getUsuarios(): Observable<any> {
    return this.http.get<any>(`${this.base}`, {
      withCredentials: true,
    });
  }

  validarSesion(): Observable<any> {
    return this.http.get<any>(`${environment.usuarioApi}/me`, {
      withCredentials: true,
    });
  }

  eliminarUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`, {
      withCredentials: true,
    });
  }

  actualizarRol(id: number, nuevoRol: string): Observable<string> {
  return this.http.put<string>(
    `${this.base}/${id}/rol`,
    { nuevoRol },
    { withCredentials: true, responseType: 'text' as 'json' } 
  );
}

  crearUsuario(usuario: { nombre: string; email: string; password: string }): Observable<any> {
  return this.http.post<any>(`${this.base}`, usuario, { withCredentials: true });
}

}
