import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptorProvider } from './interceptors/auth.interceptor';
import { providePrimeNG } from 'primeng/config';
import Lara from '@primeng/themes/lara';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { MessageService } from 'primeng/api'; 


export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()), // 👈 busca interceptores inyectables (como clases @Injectable)
    authInterceptorProvider,
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Lara,
        options: {
          darkMode: false
        }
      }
    }),
      MessageService
  ]

};
