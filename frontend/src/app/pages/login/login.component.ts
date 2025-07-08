import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [FormsModule, CommonModule]
})
export class LoginComponent implements OnInit {

  email: string = '';
  password: string = '';
  error: string = '';

  private baseUrl = environment.apiUrlBase;
  private validarSessionUrl = `${this.baseUrl}/api/auth/validar-cookie`;


  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.http.get(this.validarSessionUrl, { withCredentials: true }).subscribe({
      next: () => {
        this.router.navigate(['/usuarios']);
      },
      error: () => {
        console.log('🔒 No hay sesión activa — seguimos en login');
      }
    });
  }

  login(): void {
    const credentials = { email: this.email, password: this.password };

    this.http.post(`${this.baseUrl}/api/auth/login`, credentials, {
      withCredentials: true
    }).subscribe({
      next: () => {
        this.router.navigate(['/usuarios']);
      },
      error: (err) => {
        console.error(err);
        this.error = 'Credenciales inválidas';
      }
    });
  }
}
