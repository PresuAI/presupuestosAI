import { Component } from '@angular/core';
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

  // Memoria de conversación con Assistants
  private threadId: string | null = null;

  constructor(private http: HttpClient) {}

  enviarMensaje(): void {
    const mensaje = (this.mensajeUsuario || '').trim();
    if (!mensaje || this.cargando) return;

    // UI: muestro mi mensaje y limpio input
    this.historialMensajes.push({ origen: 'yo', texto: mensaje });
    this.mensajeUsuario = '';
    this.cargando = true;

    // Body que espera el back: { mensaje, threadId }
    const body = { mensaje, threadId: this.threadId };

    this.http.post(`${environment.openAIBase}/mensaje`, body, {
      withCredentials: true,
      responseType: 'text'
    }).subscribe({
      next: (raw) => {
        this.cargando = false;

        // Parseo del wrapper { threadId, data }
        const { threadId, payload } = this.parseWrapper(raw || '');
        if (threadId) this.threadId = threadId;

        // payload puede ser { mensaje: "..." } o string llano
        const textoIA = this.extraerMensaje(payload);
        this.historialMensajes.push({ origen: 'ia', texto: textoIA });
      },
      error: () => {
        this.cargando = false;
        this.historialMensajes.push({
          origen: 'ia',
          texto: '❌ Error al conectar con la IA.'
        });
      }
    });
  }

  nuevaConversacion(): void {
    this.threadId = null;              // resetea memoria del assistant
    this.historialMensajes = [];       // limpia chat
    this.mensajeUsuario = '';
  }

  // ===== Helpers =====
  private parseWrapper(raw: string): { threadId: string | null; payload: any } {
    const outer = JSON.parse(raw.trim());

    if (outer?.error) {
      throw new Error(String(outer.error));
    }

    const threadId: string | null = outer?.threadId ?? null;
    let data = outer?.data;

    // El back puede devolver data como string (por safeJson)
    if (typeof data === 'string') {
      const cleaned = this.stripFences(data.trim());
      try { data = JSON.parse(cleaned); }
      catch { data = { mensaje: cleaned }; }
    }
    return { threadId, payload: data };
  }

  private extraerMensaje(payload: any): string {
    if (!payload) return '⚠️ Sin respuesta.';
    if (typeof payload === 'string') return payload;
    if (payload?.mensaje) return String(payload.mensaje);
    // fallback por si el assistant devolviera un objeto distinto
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
}
