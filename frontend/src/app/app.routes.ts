import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { AuthGuard } from './guards/auth.guard';
import { ProductosComponent } from './pages/productos/productos.component';
import { ClientesComponent } from './pages/clientes/clientes.component';
import { PresupuestosComponent } from './pages/presupuestos/presupuestos.component';
import { PresupuestosAiComponent } from './pages/presupuestos-ai/presupuestos-ai.component';
import { LayoutComponent } from './shared/layout/layout.component';
import { EstadisticasComponent } from './pages/estadisticas/estadisticas.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent, // Aplica layout
    canActivate: [AuthGuard],
    children: [
      { path: 'usuarios', component: UsuariosComponent },
      { path: 'productos', component: ProductosComponent },
      { path: 'clientes', component: ClientesComponent },
      { path: 'presupuestos', component: PresupuestosComponent },
      { path: 'presupuestos-ai', component: PresupuestosAiComponent },
      { path: 'estadisticas', component: EstadisticasComponent },
      { path: '', redirectTo: 'usuarios', pathMatch: 'full' } // default dentro del layout
    ]
  },
  { path: 'login', component: LoginComponent }, // Fuera del layout
  { path: '**', redirectTo: 'login' } // catch-all
  
];

