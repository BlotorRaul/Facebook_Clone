import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map, catchError, tap } from 'rxjs/operators';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  avatarUrl: string;
  role: 'user' | 'admin';
  isBanned?: boolean;
  phone?: string;
  score?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private apiUrl = environment.apiUrl;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';

  constructor(
    private http: HttpClient,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const storedUser = localStorage.getItem(this.USER_KEY);
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem(this.TOKEN_KEY);
      }
    }
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  register(user: Omit<User, 'id'>): Observable<boolean> {
    return this.http.post<User>(`${this.apiUrl}/auth/register`, user).pipe(
      map(newUser => {
        console.log('User registered successfully:', newUser);
        return true;
      }),
      catchError(error => {
        console.error('Registration error:', error);
        return of(false);
      })
    );
  }

  login(email: string, password: string): Observable<boolean> {
    console.log('Attempting login with:', { email });
    return this.http.post<User>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      map(user => {
        if (user) {
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
          this.currentUserSubject.next(user);
          return true;
        }
        return false;
      }),
      catchError(error => {
        if (error.status === 403) {
          alert('Contul tău a fost banat de un administrator!');
        } else {
          alert('Login failed! Verifică datele.');
        }
        return of(false);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth']);
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/auth/users`);
  }

  updateUser(userId: string, updates: Partial<User>): Observable<boolean> {
    return this.http.put<User>(`${this.apiUrl}/auth/update-profile`, updates).pipe(
      map(updatedUser => {
        const currentUser = this.currentUserSubject.value;
        if (currentUser && currentUser.id === userId) {
          if (updatedUser.isBanned) {
            this.logout();
            return true;
          }
          this.currentUserSubject.next(updatedUser);
          localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
        }
        return true;
      }),
      catchError(error => {
        console.error('Update user error:', error);
        return of(false);
      })
    );
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'admin';
  }

  hasPermission(action: 'delete' | 'edit' | 'admin', resourceOwnerId: string): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;

    if (action === 'admin') {
      return user.role === 'admin';
    }

    return user.role === 'admin' || user.id === resourceOwnerId;
  }

  banUser(userId: string): Observable<boolean> {
    return this.http.post(`${this.apiUrl}/auth/ban/${userId}`, {}).pipe(
      map(() => {
        const currentUser = this.currentUserSubject.value;
        if (currentUser && currentUser.id === userId) {
          this.logout();
        }
        return true;
      }),
      catchError(error => {
        console.error('Ban user error:', error);
        return of(false);
      })
    );
  }

  unbanUser(userId: string): Observable<boolean> {
    return this.http.post(`${this.apiUrl}/auth/unban/${userId}`, {}).pipe(
      map(() => true),
      catchError(error => {
        console.error('Unban user error:', error);
        return of(false);
      })
    );
  }

  updateScoreForPostVote(userId: string, isUpvote: boolean): Observable<boolean> {
    return this.http.put(`${this.apiUrl}/auth/score/${userId}`, { isUpvote }).pipe(
      map(() => true),
      catchError(error => {
        console.error('Update score error:', error);
        return of(false);
      })
    );
  }

  updateScoreForCommentVote(userId: string, isUpvote: boolean): Observable<boolean> {
    return this.http.put(`${this.apiUrl}/auth/score/${userId}`, { isUpvote }).pipe(
      map(() => true),
      catchError(error => {
        console.error('Update score error:', error);
        return of(false);
      })
    );
  }

  updateScoreForDownvotingComment(userId: string, isUpvote: boolean = false): Observable<boolean> {
    return this.http.put(`${this.apiUrl}/auth/score/${userId}`, { isUpvote }).pipe(
      map(() => true),
      catchError(error => {
        console.error('Update score error:', error);
        return of(false);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
}
