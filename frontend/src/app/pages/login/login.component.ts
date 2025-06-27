import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: []
})
export class LoginComponent implements OnInit {

  private validarSessionUrl = `${environment.usuarioApi}/auth/validar-cookie`;

  private apiBase = environment.apiUrlBase;

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit(): void {
    console.log('ngOnInit ejecutado');
    this.http.get(this.validarSessionUrl, { withCredentials: true })
      .subscribe({
        next: () => {
          console.log('✅ Sesión válida, redirigiendo...');
          this.router.navigate(['/usuarios']);
        },
        error: () => {
          console.log('🔒 No hay sesión activa — seguimos en login');
        },
      });
  }

  iniciarSesionConGoogle(): void {
    window.location.href = `${this.apiBase}/oauth2/authorization/google`;
  }
}
