import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [FormsModule, CommonModule],
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  error = '';
  loading = false;

  private baseUrl = environment.apiUrlBase;
  private validarSessionUrl = `${this.baseUrl}/api/auth/validar-cookie`;
  private loginUrl = `${this.baseUrl}/api/auth/login`;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    // Si ya hay cookie válida, pasamos a /usuarios
    this.http.get(this.validarSessionUrl, { withCredentials: true }).subscribe({
      next: () => this.router.navigate(['/usuarios']),
      error: () => {
        // sin sesión: nos quedamos en login
        // console.log('No hay sesión activa');
      },
    });
  }

  login(): void {
    if (this.loading) return;
    this.error = '';
    this.loading = true;

    const credentials = {
      email: (this.email || '').trim().toLowerCase(),
      password: this.password,
    };

    this.http.post(this.loginUrl, credentials, { withCredentials: true }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/usuarios']);
      },
      error: (err) => {
        this.loading = false;
        // Mensaje simple; podés mapear err.status si querés
        this.error = err?.error?.mensaje || 'Credenciales inválidas';
      },
    });
  }
}
