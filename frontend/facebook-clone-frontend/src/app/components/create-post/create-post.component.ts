import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostService } from '../../services/post.service';
import { User } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="create-post">
      <div class="post-input">
        <img [src]="currentUser?.avatarUrl" [alt]="currentUser?.name" class="user-avatar">
        <input type="text" 
               [(ngModel)]="newPostText" 
               placeholder="What's on your mind?"
               class="post-input-text">
      </div>
      
      <div *ngIf="selectedImage" class="image-preview">
        <img [src]="selectedImage" alt="Selected image">
        <button class="remove-image" (click)="removeImage()">×</button>
      </div>

      <div class="create-post-actions">
        <label class="post-action">
          <i class="fas fa-image"></i>
          Photo/Video
          <input type="file" (change)="onImageSelected($event)" accept="image/*" hidden>
        </label>
        <button class="submit-button" 
                (click)="createPost()" 
                [disabled]="(!newPostText && !selectedImage) || isSubmitting">
          Post
        </button>
      </div>
    </div>
  `,
  styles: [`
    .create-post {
      background: white;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 16px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .post-input {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }

    .post-input-text {
      flex: 1;
      border: none;
      padding: 8px 12px;
      border-radius: 20px;
      background: #f0f2f5;
      font-size: 15px;
    }

    .post-input-text:focus {
      outline: none;
      background: #e4e6eb;
    }

    .image-preview {
      position: relative;
      margin: 8px 0;
      border-radius: 8px;
      overflow: hidden;
    }

    .image-preview img {
      width: 100%;
      max-height: 300px;
      object-fit: cover;
      border-radius: 8px;
    }

    .remove-image {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.6);
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }

    .create-post-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 8px;
      border-top: 1px solid #e4e6eb;
    }

    .post-action {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border-radius: 8px;
      cursor: pointer;
      color: #65676b;
      transition: background-color 0.2s;
    }

    .post-action:hover {
      background-color: #f0f2f5;
    }

    .submit-button {
      background-color: #1877f2;
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .submit-button:hover:not(:disabled) {
      background-color: #166fe5;
    }

    .submit-button:disabled {
      background-color: #e4e6eb;
      color: #bcc0c4;
      cursor: not-allowed;
    }
  `]
})
export class CreatePostComponent {
  @Input() currentUser: User | null = null;
  newPostText: string = '';
  selectedImage: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  isSubmitting: boolean = false;
  post = {
    title: '',
    content: '',
    author: {
      id: '1',
      name: 'Demo User',
      avatarUrl: 'https://via.placeholder.com/150'
    }
  };
  successMsg = '';
  errorMsg = '';

  constructor(private postService: PostService, private http: HttpClient) {}

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should not exceed 5MB');
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.selectedImage = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.selectedImage = null;
  }

  createPost(): void {
    if ((!this.newPostText && !this.selectedFile) || this.isSubmitting || !this.currentUser) {
      return;
    }
    this.isSubmitting = true;
    this.successMsg = '';
    this.errorMsg = '';

    const create = (imageUrl?: string) => {
      const newPost = {
        title: '',
        content: this.newPostText,
        author: {
          id: this.currentUser!.id,
          name: this.currentUser!.name,
          avatarUrl: this.currentUser!.avatarUrl
        },
        imageUrl: imageUrl,
        tags: [],
        comments: [],
        likesCount: 0,
        commentsCount: 0,
        likedBy: []
      };
      this.postService.addPost(newPost).subscribe({
        next: () => {
          this.successMsg = 'Postare creată cu succes!';
          this.isSubmitting = false;
          this.newPostText = '';
          this.selectedImage = null;
          this.selectedFile = null;
        },
        error: (err) => {
          this.errorMsg = 'Eroare la creare postare!';
          this.isSubmitting = false;
        }
      });
    };

    if (this.selectedFile) {
      this.postService.uploadImage(this.selectedFile).subscribe({
        next: (imageUrl) => {
          create(imageUrl);
        },
        error: () => {
          this.errorMsg = 'Eroare la upload imagine!';
          this.isSubmitting = false;
        }
      });
    } else {
      create();
    }
  }
} 