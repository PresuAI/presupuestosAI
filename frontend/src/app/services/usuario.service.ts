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

}
