import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { SidebarModule } from 'primeng/sidebar';
import { PanelMenuModule } from 'primeng/panelmenu';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  imports: [MenubarModule, CommonModule, SidebarModule, PanelMenuModule, ButtonModule]
})
export class NavbarComponent implements OnInit {
  menuVisible = false;
iaOpen: boolean = false;
  desktopItems: MenuItem[] = [];
  mobileItems: MenuItem[] = [];

  constructor(private router: Router,private authService: AuthService) { }

  ngOnInit(): void {
    const items: MenuItem[] = [
      {
        label: 'Usuarios',
        icon: 'pi pi-users',
        command: () => this.navegar('/usuarios')
      },
      {
        label: 'Productos',
        icon: 'pi pi-shopping-cart',
        command: () => this.navegar('/productos')
      },
      {
        label: 'Clientes',
        icon: 'pi pi-id-card',
        command: () => this.navegar('/clientes')
      },
      {
        label: 'Presupuestos',
        icon: 'pi pi-file-edit',
        command: () => this.navegar('/presupuestos')
      },
      {
        label: 'Presupuestos AI',
        icon: 'pi pi-android',
        command: () => this.navegar('/presupuestos-ai')
      }
    ];

    // Mismo menú para ambas vistas; podés diferenciarlos si querés.
    this.desktopItems = items;
    this.mobileItems = items;
  }

  navegar(ruta: string): void {
    this.menuVisible = false;
    this.router.navigate([ruta]);
  }
  cerrarSesion(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        // opcional: mostrar toast si falla
      }
    });
  }
}
