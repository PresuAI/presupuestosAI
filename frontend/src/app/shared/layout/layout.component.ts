import { Component } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { RouterOutlet } from '@angular/router'; // 👈 necesario para usar <router-outlet>

@Component({
  selector: 'app-layout',
  standalone: true,
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  imports: [NavbarComponent, RouterOutlet] // 👈 agregamos RouterOutlet
})
export class LayoutComponent {}
