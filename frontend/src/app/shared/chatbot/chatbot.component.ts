// src/app/shared/chatbot/chatbot.component.ts
import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { environment } from '../../../environments/environment';
import { MarkdownHtmlPipe } from '../../pipes/markdown-html.pipe';

type Mensaje = { origen: 'yo' | 'ia'; texto: string };

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, MarkdownHtmlPipe],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss']
})
export class ChatbotComponent {
  mostrarChat = false;
  mensajeUsuario = '';
  historialMensajes: Mensaje[] = [];
  cargando = false;

  private threadId: string | null = null;

  // Contenedor que scrollea
  @ViewChild('mensajesRef') private mensajesRef?: ElementRef<HTMLDivElement>;

  constructor(private http: HttpClient) {}

  abrir(): void {
    this.mostrarChat = true;
    this.scrollToEnd(false);
  }

  cerrar(): void {
    this.mostrarChat = false;
  }

  nuevaConversacion(): void {
    this.threadId = null;
    this.historialMensajes = [];
    this.mensajeUsuario = '';
    this.scrollToEnd(false);
  }

  enviarMensaje(): void {
    const texto = (this.mensajeUsuario || '').trim();
    if (!texto || this.cargando) return;

    this.historialMensajes.push({ origen: 'yo', texto });
    this.mensajeUsuario = '';
    this.scrollToEnd(); // tras mi mensaje

    this.cargando = true;
    const body = { mensaje: texto, threadId: this.threadId };

    this.http.post(`${environment.openAIBase}/mensaje`, body, {
      withCredentials: true,
      responseType: 'text'
    }).subscribe({
      next: (raw) => {
        this.cargando = false;

        const { threadId, payload } = this.parseWrapper(raw || '');
        if (threadId) this.threadId = threadId;

        const textoIA = this.extraerMensaje(payload);
        this.historialMensajes.push({ origen: 'ia', texto: textoIA });
        this.scrollToEnd(); // tras respuesta
      },
      error: () => {
        this.cargando = false;
        this.historialMensajes.push({ origen: 'ia', texto: '❌ Error al conectar con la IA.' });
        this.scrollToEnd(); // también en error
      }
    });
  }

  // ========== Helpers ==========
  /** El back responde { threadId, data } (data puede venir string por safeJson). */
  private parseWrapper(raw: string): { threadId: string | null; payload: any } {
    const outer = JSON.parse(raw.trim());
    if (outer?.error) throw new Error(String(outer.error));

    const threadId: string | null = outer?.threadId ?? null;
    let data = outer?.data;

    if (typeof data === 'string') {
      const cleaned = this.stripFences(data.trim());
      try { data = JSON.parse(cleaned); } catch { data = { mensaje: cleaned }; }
    }
    return { threadId, payload: data };
  }

  private extraerMensaje(payload: any): string {
    if (!payload) return '⚠️ Sin respuesta.';
    if (typeof payload === 'string') return payload;
    if (payload?.mensaje) return String(payload.mensaje);
    try { return '```json\n' + JSON.stringify(payload, null, 2) + '\n```'; }
    catch { return String(payload); }
  }

  private stripFences(s: string): string {
    let out = s;
    if (out.startsWith('```json')) out = out.slice(7);
    else if (out.startsWith('```')) out = out.slice(3);
    if (out.endsWith('```')) out = out.slice(0, -3);
    return out.trim();
  }

  /** Desplaza el contenedor de mensajes al fondo (sin type narrowing raro). */
  private scrollToEnd(smooth = true) {
    // Doble RAF para asegurar que el DOM ya pintó el último mensaje
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = this.mensajesRef?.nativeElement as HTMLDivElement | null;
      if (!el) return;
      const top = el.scrollHeight - el.clientHeight;

      // usa scrollTo si está (suave), si no, scrollTop directo
      const anyEl = el as any;
      if (smooth && typeof anyEl.scrollTo === 'function') {
        anyEl.scrollTo({ top, behavior: 'smooth' });
      } else {
        el.scrollTop = top;
      }
    }));
  }
}
