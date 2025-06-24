import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { SidebarModule } from 'primeng/sidebar';
import { PanelMenuModule } from 'primeng/panelmenu';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  imports: [MenubarModule, CommonModule, SidebarModule, PanelMenuModule, ButtonModule]
})
export class NavbarComponent {
  menuVisible = false; // ✅ ESTA LÍNEA ES CLAVE
  items: MenuItem[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.items = [
      {
        label: 'Usuarios',
        icon: 'pi pi-users',
        command: () => this.navegar('/usuarios')
      },
      {
        label: 'Productos',
        icon: 'pi pi-shopping-cart',
        command: () => this.navegar('/productos')
      }
    ];
  }

  navegar(ruta: string): void {
    this.menuVisible = false; 
    this.router.navigate([ruta]);
  }
}
