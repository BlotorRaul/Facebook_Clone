import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostService } from '../../services/post.service';
import { User } from '../../services/auth.service';

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
  isSubmitting: boolean = false;

  constructor(private postService: PostService) {}

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
    if ((!this.newPostText && !this.selectedImage) || this.isSubmitting || !this.currentUser) {
      return;
    }

    this.isSubmitting = true;

    try {
      const newPost = {
        author: {
          name: this.currentUser.name,
          avatarUrl: this.currentUser.avatarUrl
        },
        content: this.newPostText,
        imageUrl: this.selectedImage as string | undefined,
        timePosted: 'Just now'
      };

      // Add the new post
      this.postService.addPost(newPost);
      console.log('New post created:', newPost);

      // Reset form
      this.newPostText = '';
      this.selectedImage = null;
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      this.isSubmitting = false;
    }
  }
} 