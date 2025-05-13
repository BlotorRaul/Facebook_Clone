import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';

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
  private readonly USERS_KEY = 'facebook_clone_users';
  private readonly CURRENT_USER_KEY = 'facebook_clone_current_user';

  constructor(
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.initializeDemoUsers();
    this.loadCurrentUser();
  }

  private initializeDemoUsers(): void {
    if (!localStorage.getItem(this.USERS_KEY)) {
      const demoUsers: User[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'blotor.raul@yahoo.com',
          password: 'password123',
          avatarUrl: 'https://i.pravatar.cc/150?img=1',
          role: 'user',
          isBanned: false,
          phone: '+40753420201',
          score: 0
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          password: 'password123',
          avatarUrl: 'https://i.pravatar.cc/150?img=2',
          role: 'user',
          isBanned: false,
          phone: '+407xxxxxxxx',
          score: 0
        },
        {
          id: '3',
          name: 'Mike Johnson',
          email: 'mike@example.com',
          password: 'password123',
          avatarUrl: 'https://i.pravatar.cc/150?img=3',
          role: 'user',
          isBanned: false,
          phone: '',
          score: 0
        },
        {
          id: '4',
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'admin123',
          avatarUrl: 'https://i.pravatar.cc/150?img=4',
          role: 'admin',
          isBanned: false,
          phone: '',
          score: 0
        }
      ];
      localStorage.setItem(this.USERS_KEY, JSON.stringify(demoUsers));
    } else {
      const users = this.getUsers();
      const adminExists = users.some(u => u.email === 'admin@example.com' && u.role === 'admin');
      if (!adminExists) {
        users.push({
          id: '4',
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'admin123',
          avatarUrl: 'https://i.pravatar.cc/150?img=4',
          role: 'admin',
          isBanned: false,
          phone: '',
          score: 0
        });
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      }
    }
  }

  private loadCurrentUser(): void {
    const savedUser = localStorage.getItem(this.CURRENT_USER_KEY);
    if (savedUser) {
      const user = JSON.parse(savedUser);
      if (user.isBanned) {
        this.logout();
        return;
      }
      this.currentUserSubject.next(user);
    }
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  private getUsers(): User[] {
    const users = localStorage.getItem(this.USERS_KEY);
    return users ? JSON.parse(users) : [];
  }

  register(user: Omit<User, 'id'>): boolean {
    const users = this.getUsers();
    
    if (users.some(u => u.email === user.email)) {
      return false;
    }

    const newUser: User = {
      ...user,
      id: Date.now().toString(),
      isBanned: false
    };

    users.push(newUser);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    return true;
  }

  login(email: string, password: string): boolean {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      if (user.isBanned) {
        throw new Error('Your account has been blocked. Please contact support for more information.');
      }
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
      this.currentUserSubject.next(user);
      return true;
    }
    
    return false;
  }

  logout(): void {
    localStorage.removeItem(this.CURRENT_USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth']);
  }

  getAllUsers(): User[] {
    return this.getUsers().map(user => {
      const { password, ...safeUser } = user;
      return safeUser as User;
    });
  }

  updateUser(userId: string, updates: Partial<User>): boolean {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return false;

    users[userIndex] = { ...users[userIndex], ...updates };
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));

    const currentUser = this.currentUserSubject.value;
    if (currentUser && currentUser.id === userId) {
      const updatedUser = { ...currentUser, ...updates };
      if (updatedUser.isBanned) {
        this.logout();
        return true;
      }
      this.currentUserSubject.next(updatedUser);
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(updatedUser));
    }

    return true;
  }

  isAdmin(): boolean {
    const currentUser = this.getCurrentUserValue();
    return currentUser?.role === 'admin';
  }

  hasPermission(action: 'delete' | 'edit' | 'admin', resourceOwnerId: string): boolean {
    const currentUser = this.getCurrentUserValue();
    if (!currentUser) return false;
    
    if (currentUser.role === 'admin') return true;
    
    if (action === 'admin') return false;
    
    return currentUser.id === resourceOwnerId;
  }

  async banUser(userId: string): Promise<boolean> {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return false;
    if (users[userIndex].role === 'admin') return false;

    users[userIndex].isBanned = true;
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));

    try {
      console.log('[BAN] Trimit notificare email către:', users[userIndex].email);
      await this.notificationService.sendBanEmail(
        users[userIndex].name,
        users[userIndex].email,
        'Încălcare reguli'
      );
      if (users[userIndex].phone) {
        console.log('[BAN] Trimit SMS către:', users[userIndex].phone);
        await this.notificationService.sendBanSMS(
          users[userIndex].phone,
          users[userIndex].name,
          'Încălcare reguli'
        );
      } else {
        console.warn('[BAN] Userul nu are număr de telefon pentru SMS.');
      }
    } catch (error) {
      console.error('[BAN] Eroare la trimiterea notificărilor:', error);
    }

    const currentUser = this.getCurrentUserValue();
    if (currentUser && currentUser.id === userId) {
      this.logout();
    }

    return true;
  }

  unbanUser(userId: string): boolean {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return false;

    users[userIndex].isBanned = false;
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    return true;
  }

  updateScoreForPostVote(userId: string, isUpvote: boolean): boolean {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return false;

    const scoreChange = isUpvote ? 1 : -1;
    users[userIndex].score = (users[userIndex].score || 0) + scoreChange;
    
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    
    const currentUser = this.currentUserSubject.value;
    if (currentUser && currentUser.id === userId) {
      const updatedUser = { ...currentUser, score: users[userIndex].score };
      this.currentUserSubject.next(updatedUser);
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(updatedUser));
    }

    return true;
  }

  updateScoreForCommentVote(userId: string, isUpvote: boolean): boolean {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return false;

    const scoreChange = isUpvote ? 2 : -2;
    users[userIndex].score = (users[userIndex].score || 0) + scoreChange;
    
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    
    const currentUser = this.currentUserSubject.value;
    if (currentUser && currentUser.id === userId) {
      const updatedUser = { ...currentUser, score: users[userIndex].score };
      this.currentUserSubject.next(updatedUser);
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(updatedUser));
    }

    return true;
  }

  updateScoreForDownvotingComment(userId: string, isUpvote: boolean = false): boolean {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return false;

    const scoreChange = isUpvote ? -1 : 1;
    users[userIndex].score = (users[userIndex].score || 0) + scoreChange;
    
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    
    const currentUser = this.currentUserSubject.value;
    if (currentUser && currentUser.id === userId) {
      const updatedUser = { ...currentUser, score: users[userIndex].score };
      this.currentUserSubject.next(updatedUser);
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(updatedUser));
    }

    return true;
  }
}
