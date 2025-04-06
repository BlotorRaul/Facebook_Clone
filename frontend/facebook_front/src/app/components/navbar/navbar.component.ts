import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav class="navbar">
      <div class="nav-brand">Facebook Clone</div>
      <div class="nav-links">
        <a routerLink="/dashboard">Home</a>
        <a routerLink="/posts">Posts</a>
        <a routerLink="/profile">Profile</a>
        <button (click)="logout()" class="logout-btn">Logout</button>
      </div>
    </nav>
  `,
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  constructor(private authService: AuthService) {}

  logout() {
    this.authService.logout();
  }
} 