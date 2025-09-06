import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PresupuestoAiService {
  private baseUrl = `${environment.apiNegocioUrlBase}/api/gemini/presupuesto`;
  private DEBUG_AI = true;

  constructor(private http: HttpClient) {}

  generarPresupuestoAI(dto: any): Observable<string> {
    // traceId para correlacionar en front/back
    const traceId =
      (crypto as any)?.randomUUID?.() ??
      ('t_' + Math.random().toString(36).slice(2));

    const headers = new HttpHeaders({ 'X-Trace-Id': String(traceId) });

    if (this.DEBUG_AI) {
      console.groupCollapsed(`%c[AI][${traceId}] → POST ${this.baseUrl}`, 'color:#0a7');
      console.time(`[AI][${traceId}] roundtrip`);
      console.log('Request DTO:', dto);
      console.log('Headers:', { 'X-Trace-Id': traceId });
      console.groupEnd();
    }

    return this.http
      .post(this.baseUrl, dto, {
        headers,
        withCredentials: true,
        observe: 'response',
        responseType: 'text',
      })
      .pipe(
        tap((res) => {
          if (!this.DEBUG_AI) return;
          console.groupCollapsed(`%c[AI][${traceId}] ← ${res.status} ${this.baseUrl}`, 'color:#07a');
          console.log('Status:', res.status);
          console.log('Response headers:', Object.fromEntries(res.headers.keys().map(k => [k, res.headers.get(k)!])));
          console.log('Body (raw):', res.body);
          console.timeEnd(`[AI][${traceId}] roundtrip`);
          console.groupEnd();
        }),
        map((res) => res.body as string),
        catchError((err: HttpErrorResponse) => {
          if (this.DEBUG_AI) {
            console.groupCollapsed(`%c[AI][${traceId}] ✖ ERROR ${this.baseUrl}`, 'color:#c00');
            console.log('Status:', err.status);
            console.log('Message:', err.message);
            console.log('Error body:', err.error);
            console.timeEnd(`[AI][${traceId}] roundtrip`);
            console.groupEnd();
          }
          return throwError(() => err);
        })
      );
  }
}
