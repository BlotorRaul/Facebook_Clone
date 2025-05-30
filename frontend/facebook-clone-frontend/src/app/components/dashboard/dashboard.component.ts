import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Dashboard</h1>
        <button class="back-button" (click)="goBack()">Back to Home</button>
      </div>

      <div class="welcome-message">
        <h2>Bine ai venit stapane!</h2>
      </div>

      <div class="users-section">
        <h3>User Management</h3>
        <div class="users-list">
          <div class="user-card" *ngFor="let user of users$ | async">
            <div class="user-info">
              <img [src]="user.avatarUrl" [alt]="user.name" class="user-avatar">
              <div class="user-details">
                <h4>{{user.name}}</h4>
                <p>{{user.email}}</p>
                <span class="user-role">{{user.role}}</span>
                <span class="user-status" [class.banned]="user.isBanned">
                  {{user.isBanned ? 'Banned' : 'Active'}}
                </span>
              </div>
            </div>
            <div class="user-actions" *ngIf="user.role !== 'admin'">
              <button 
                [class.ban-button]="!user.isBanned"
                [class.unban-button]="user.isBanned"
                (click)="toggleBan(user)"
                [disabled]="isProcessing">
                {{user.isBanned ? 'Unban' : 'Ban'}}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .back-button {
      padding: 8px 16px;
      background-color: #1b74e4;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s;
    }

    .back-button:hover {
      background-color: #166fe5;
    }

    .welcome-message {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .welcome-message h2 {
      color: #1b74e4;
      margin: 0;
    }

    .users-section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .users-section h3 {
      margin-top: 0;
      margin-bottom: 20px;
      color: #1c1e21;
    }

    .users-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .user-card {
      background: #f0f2f5;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .user-info {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .user-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .user-details h4 {
      margin: 0;
      color: #1c1e21;
    }

    .user-details p {
      margin: 0;
      color: #65676b;
      font-size: 14px;
    }

    .user-role {
      font-size: 12px;
      color: #1b74e4;
      text-transform: uppercase;
    }

    .user-status {
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 4px;
      background: #31a24c;
      color: white;
      display: inline-block;
    }

    .user-status.banned {
      background: #dc3545;
    }

    .ban-button, .unban-button {
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .ban-button {
      background-color: #dc3545;
      color: white;
    }

    .ban-button:hover {
      background-color: #c82333;
    }

    .unban-button {
      background-color: #28a745;
      color: white;
    }

    .unban-button:hover {
      background-color: #218838;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class DashboardComponent implements OnInit {
  users$: Observable<User[]>;
  currentUser: User | null = null;
  isProcessing: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.users$ = this.authService.getAllUsers();
    this.currentUser = this.authService.getCurrentUserValue();
  }

  ngOnInit(): void {
    if (!this.currentUser || !this.authService.isAdmin()) {
      this.router.navigate(['/home']);
    }
  }

  async toggleBan(user: User) {
    if (this.isProcessing) return;
    this.isProcessing = true;
    try {
      if (user.isBanned) {
        this.authService.unbanUser(user.id).subscribe(success => {
          if (success) {
            this.users$ = this.authService.getAllUsers();
          }
          this.isProcessing = false;
        });
      } else {
        this.authService.banUser(user.id).subscribe(success => {
          if (success) {
            this.notificationService.notifyUserBlocked(user.email, user.name)
              .then(() => console.log('[Dashboard] Ban email sent successfully'))
              .catch((error: Error) => console.error('[Dashboard] Failed to send ban email:', error));

            if (user.phone) {
              this.notificationService.sendBanSMS(user.phone, user.name)
                .then(() => console.log('[Dashboard] Ban SMS sent successfully'))
                .catch((error: Error) => console.error('[Dashboard] Failed to send ban SMS:', error));
            }
            this.users$ = this.authService.getAllUsers();
          }
          this.isProcessing = false;
        });
      }
    } catch (error) {
      console.error('Eroare la blocarea/deblocarea utilizatorului:', error);
      this.isProcessing = false;
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  hasPermission(action: 'delete' | 'edit' | 'admin', resourceOwnerId: string): boolean {
    return this.authService.hasPermission(action, resourceOwnerId);
  }
}
