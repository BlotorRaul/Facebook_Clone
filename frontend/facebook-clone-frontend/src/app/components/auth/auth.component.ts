import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent implements OnInit {
  loginForm: FormGroup;
  signupForm: FormGroup;
  loginError: string = '';
  signupError: string = '';
  showSignup: boolean = false;
  months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  days = Array.from({length: 31}, (_, i) => i + 1);
  years = Array.from({length: 100}, (_, i) => new Date().getFullYear() - i);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.signupForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // If user is already logged in, redirect to home
    if (this.authService.getCurrentUser()) {
      this.router.navigate(['/home']);
    }
  }

  toggleSignup(): void {
    this.showSignup = !this.showSignup;
    this.loginError = '';
    this.signupError = '';
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      try {
        if (this.authService.login(email, password)) {
          this.router.navigate(['/home']);
        } else {
          this.loginError = 'Invalid email or password';
        }
      } catch (error) {
        this.loginError = error instanceof Error ? error.message : 'An error occurred';
      }
    }
  }

  onSignup(): void {
    if (this.signupForm.valid) {
      const { password, confirmPassword } = this.signupForm.value;
      if (password !== confirmPassword) {
        this.signupError = 'Passwords do not match';
        return;
      }
      // For demo purposes, just redirect to login
      this.showSignup = false;
      this.loginError = 'Please use the demo account to login';
    }
  }
}
