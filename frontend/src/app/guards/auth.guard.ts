import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private http: HttpClient, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.http.get('http://localhost:8080/api/auth/validar-cookie', { withCredentials: true }).pipe(
      map(() => true), // ✅ Autenticado
      catchError(() => {
        this.router.navigate(['/login']); // 🔒 No autenticado → redirigir
        return of(false);
      })
    );
  }
}
