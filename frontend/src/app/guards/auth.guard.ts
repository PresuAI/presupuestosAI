import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  private validarCookieUrl = `${environment.apiUrlBase}/api/auth/validar-cookie`;

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  canActivate(): Observable<boolean> {
    return this.http
      .get(this.validarCookieUrl, { withCredentials: true })
      .pipe(
        map(() => true),
        catchError(() => {
          this.router.navigate(['/login']);
          return of(false);
        })
      );
  }
}
