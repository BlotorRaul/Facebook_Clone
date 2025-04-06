import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticated = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticated.asObservable();

  constructor(private router: Router) {
    // Check if user is logged in from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      this.isAuthenticated.next(true);
    }
  }

  login(credentials: {email: string, password: string}) {
    // Here you would typically make an HTTP request to your backend
    // For now, we'll just simulate a successful login
    localStorage.setItem('token', 'dummy-token');
    this.isAuthenticated.next(true);
    this.router.navigate(['/dashboard']);
  }

  logout() {
    localStorage.removeItem('token');
    this.isAuthenticated.next(false);
    this.router.navigate(['/login']);
  }

  isLoggedIn() {
    return this.isAuthenticated.value;
  }
} 