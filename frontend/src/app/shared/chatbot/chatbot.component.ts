import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { environment } from '../../../environments/environment';
import { MarkdownHtmlPipe } from '../../pipes/markdown-html.pipe';

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
  historialMensajes: { origen: 'yo' | 'ia', texto: string }[] = [];

  constructor(private http: HttpClient) { }

  enviarMensaje(): void {
    const mensaje = this.mensajeUsuario.trim();
    if (!mensaje) return;

    this.historialMensajes.push({ origen: 'yo', texto: mensaje });
    this.mensajeUsuario = '';

    this.http.post(`${environment.apiNegocioUrlBase}/api/gemini/mensaje`, mensaje, {
      responseType: 'text',
      withCredentials: true,
    }).subscribe({
      next: respuesta => {
        this.historialMensajes.push({ origen: 'ia', texto: respuesta });
      },
      error: err => {
        this.historialMensajes.push({
          origen: 'ia',
          texto: '❌ Error al conectar con la IA.',
        });
        console.error('Error al enviar mensaje a la IA', err);
      }
    });
  }
}
