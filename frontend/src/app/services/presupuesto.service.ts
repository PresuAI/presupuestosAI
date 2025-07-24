import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PresupuestoRequest } from '../types/presupuesto';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { PresupuestoResponse } from '../types/presupuesto'; 

@Injectable({
  providedIn: 'root'
})
export class PresupuestoService {
  private url = 'http://localhost:8081/api/presupuestos';

  constructor(private http: HttpClient) {}

  crearPresupuesto(dto: PresupuestoRequest): Observable<any> {
    return this.http.post(this.url, dto, { withCredentials: true });
  }
  obtenerPresupuestos(): Observable<PresupuestoResponse[]> {
  return this.http.get<PresupuestoResponse[]>(this.url, { withCredentials: true });
}

}
