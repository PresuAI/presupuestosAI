import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PresupuestoAiService {
  private baseUrl = `${environment.apiNegocioUrlBase}/api/gemini/presupuesto`;

  constructor(private http: HttpClient) {}

  generarPresupuestoAI(dto: any): Observable<any> {
    console.log('[PresupuestoAI Service] Enviando DTO a Gemini:', dto);
    return this.http.post(this.baseUrl, dto, {
      responseType: 'text',
      withCredentials: true
    });
  }
}
