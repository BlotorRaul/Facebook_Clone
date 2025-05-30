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
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    this.signupForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?\d{7,15}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      birthMonth: ['', Validators.required],
      birthDay: ['', Validators.required],
      birthYear: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // If user is already logged in, redirect to home
    if (this.authService.getCurrentUserValue()) {
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
      this.authService.login(email, password).subscribe(
        success => {
          if (success) {
            this.router.navigate(['/home']);
          } else {
            this.loginError = 'Invalid email or password';
          }
        },
        error => {
          console.error('Login error:', error);
          this.loginError = 'An error occurred during login';
        }
      );
    }
  }

  onSignup(): void {
    if (this.signupForm.valid) {
      const { password, confirmPassword, ...rest } = this.signupForm.value;
      if (password !== confirmPassword) {
        this.signupError = 'Passwords do not match';
        return;
      }
      // Construiesc obiectul user pentru backend
      const user = {
        name: rest.firstName + ' ' + rest.lastName,
        email: rest.email,
        password: password,
        phone: rest.phone,
        avatarUrl: 'https://randomuser.me/api/portraits/lego/1.jpg',
        role: 'user' as 'user',
        // Poți adăuga și alte câmpuri dacă backendul le acceptă
        birthDate: `${rest.birthYear}-${rest.birthMonth}-${rest.birthDay}`
      };
      // Afișez datele în consola frontend
      console.log('Date trimise la backend pentru înregistrare:', user);
      this.authService.register(user).subscribe(success => {
        if (success) {
          alert('Înregistrare reușită!');
          this.signupForm.reset();
        } else {
          this.signupError = 'A apărut o eroare la înregistrare.';
        }
      });
    }
  }

  forgotPassword(event: Event): void {
    event.preventDefault();
    // Poți adăuga aici logica pentru resetarea parolei sau un mesaj
    this.loginError = 'Password reset functionality is not implemented.';
  }
}
