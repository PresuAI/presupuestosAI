import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  ingredientes: string;
  precioUnitario: number;
  esVegano: boolean;
  esVegetariano: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  private baseUrl = `${environment.productoApi}`;

  constructor(private http: HttpClient) { }

  obtenerProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.baseUrl, {
      withCredentials: true
    });
  }

  actualizarProducto(id: number, producto: Producto): Observable<Producto> {
    return this.http.put<Producto>(
      `${this.baseUrl}/${id}`,
      producto,
      { withCredentials: true }
    );
  }

  crearProducto(producto: Producto): Observable<Producto> {
    return this.http.post<Producto>(
      this.baseUrl,
      producto,
      { withCredentials: true }
    );
  }
}
