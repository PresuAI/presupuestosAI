import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'; 
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptorProvider } from './interceptors/auth.interceptor'; 
import { NavbarComponent } from './shared/navbar/navbar.component';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()), // 👈 busca interceptores inyectables (como clases @Injectable)
    authInterceptorProvider 
  ]
    
};
