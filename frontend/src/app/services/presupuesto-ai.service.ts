// src/app/services/presupuesto-ai.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

type AiResult = { threadId: string | null; payload: any };

@Injectable({ providedIn: 'root' })
export class PresupuestoAiService {
  private presupuestoUrl = `${environment.openAIBase}/presupuesto`;
  private mensajeUrl     = `${environment.openAIBase}/mensaje`;

  constructor(private http: HttpClient) {}

  generarPresupuestoAI(dto: any, threadId?: string | null): Observable<AiResult> {
    const body = { ...dto, threadId: threadId ?? null };
    return this.http
      .post(this.presupuestoUrl, body, { withCredentials: true, responseType: 'text' })
      .pipe(
        map(raw => this.parseWrapper(raw || '')),
        catchError(err => throwError(() => err))
      );
  }

  enviarMensajeAI(mensaje: string, threadId?: string | null): Observable<AiResult> {
    const body = { mensaje, threadId: threadId ?? null };
    return this.http
      .post(this.mensajeUrl, body, { withCredentials: true, responseType: 'text' })
      .pipe(
        map(raw => this.parseWrapper(raw || '')),
        catchError(err => throwError(() => err))
      );
  }

  // ---------- Helpers ----------
  private parseWrapper(raw: string): AiResult {
    const outer = JSON.parse(raw.trim());

    if (outer?.error) {
      throw new Error(String(outer.error));
    }

    const threadId: string | null = outer?.threadId ?? null;
    let data = outer?.data;

    // Puede venir objeto o string (por safeJson del back)
    if (typeof data === 'string') {
      const cleaned = this.stripFences(data.trim());
      try { data = JSON.parse(cleaned); }
      catch { data = { mensaje: cleaned }; }
    }

    return { threadId, payload: data };
  }

  private stripFences(s: string): string {
    let out = s;
    if (out.startsWith('```json')) out = out.slice(7);
    else if (out.startsWith('```')) out = out.slice(3);
    if (out.endsWith('```')) out = out.slice(0, -3);
    return out.trim();
  }
}
