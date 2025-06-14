import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private apiUrl = 'http://localhost:8080/api/usuarios';

  constructor(private http: HttpClient) {}

  getUsuarios(): Observable<any> {
    return this.http.get(this.apiUrl, {
      withCredentials: true  // ✅ Para que se envíe la cookie con el token
    });
  }
  validarSesion(): Observable<any> {
  return this.http.get('http://localhost:8080/api/usuarios/validar-sesion', {
    withCredentials: true
  });
}
eliminarUsuario(id: number): Observable<void> {
  return this.http.delete<void>(`http://localhost:8080/api/usuarios/${id}`, {
    withCredentials: true
  });
}
actualizarRol(id: number, nuevoRol: string): Observable<any> {
  return this.http.put(`http://localhost:8080/api/usuarios/${id}/rol`, 
    { nuevoRol }, 
    { withCredentials: true });
}
crearUsuario(usuario: any): Observable<any> {
  return this.http.post('http://localhost:8080/api/usuarios', usuario, {
    withCredentials: true
  });
}



}
