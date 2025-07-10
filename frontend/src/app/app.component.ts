import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { environment } from '../environments/environment'; 
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-root',
  standalone: true, 
  imports: [RouterOutlet, CommonModule, NavbarComponent,ToastModule], 
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(public authService: AuthService) {}
  title = 'frontend';
}
