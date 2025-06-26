import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: []
})
export class LoginComponent implements OnInit {

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

   ngOnInit(): void {
    console.log('ngOnInit ejecutado');

    // Verificar sesión existente antes de redirigir
    this.
    http.get('http://localhost:8080/api/auth/validar-cookie', { withCredentials: true })
      .subscribe({
        next: () => {
          console.log('✅ Sesión válida, redirigiendo...');
          this.router.navigate(['/usuarios']);
        },
        error: () => {
          console.log('🔒 No hay sesión activa');
          // No redirigimos. El usuario verá el botón de login.
        },
      });
  }

  iniciarSesionConGoogle(): void {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';

  }
}
