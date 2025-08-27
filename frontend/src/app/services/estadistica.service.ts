import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProductoEstadistica {
  nombreProducto: string;
  cantidad: number;
}

export interface TotalPorCliente {
  clienteId: number;
  nombreCliente: string;
  total: string | number; // el back manda BigDecimal; lo tratamos como string o number
}

@Injectable({ providedIn: 'root' })
export class EstadisticasService {
  private base = environment.estadisticasApi

  constructor(private http: HttpClient) {}

  ingresosMensuales(): Observable<number | string> {
    return this.http.get<number | string>(`${this.base}/ingresos-mensuales`, { withCredentials: true });
  }

  productosTop(): Observable<ProductoEstadistica[]> {
    return this.http.get<ProductoEstadistica[]>(`${this.base}/productos-top`, { withCredentials: true });
  }

  ingresosPorCliente(): Observable<TotalPorCliente[]> {
    return this.http.get<TotalPorCliente[]>(`${this.base}/ingresos-por-cliente`, { withCredentials: true });
  }
}
