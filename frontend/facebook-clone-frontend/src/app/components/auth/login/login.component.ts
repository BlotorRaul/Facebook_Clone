import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';
  isLoading: boolean = false;
  demoUsers: Partial<User>[] = [];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load demo users
    this.demoUsers = this.authService.getAllUsers();
  }

  onSubmit(): void {
    if (this.isLoading) return;

    this.isLoading = true;
    const success = this.authService.login(this.email, this.password);

    if (success) {
      this.router.navigate(['/home']);
    } else {
      alert('Invalid email or password');
    }
    this.isLoading = false;
  }

  loginWithDemo(user: Partial<User>): void {
    if (this.isLoading || !user.email) return;

    this.isLoading = true;
    const success = this.authService.login(user.email, 'password123');

    if (success) {
      this.router.navigate(['/home']);
    } else {
      alert('Error logging in with demo account');
    }
    this.isLoading = false;
  }
} 