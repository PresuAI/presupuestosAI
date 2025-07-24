import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';
import { environment } from '../environments/environment'; 
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-root',
  standalone: true, 
  imports: [RouterOutlet, CommonModule,ToastModule], 
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(public authService: AuthService) {
    this.authService.cargarUsuario().subscribe({
      error: err => {
        console.warn('Usuario no autenticado o error en /me', err);
      }
    });
  }

  title = 'frontend';
}
