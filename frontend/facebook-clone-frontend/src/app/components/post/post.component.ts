import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Post, Comment, PostService, PostStatus } from '../../services/post.service';
import { User, AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post.component.html',
  styleUrl: './post.component.css'
})
export class PostComponent {
  @Input() post!: Post;
  @Input() currentUser: User | null = null;
  @Output() onDelete = new EventEmitter<void>();
  @Output() onComment = new EventEmitter<{ postId: string; comment: string; imageUrl?: string }>();

  newComment = '';
  commentImage: string | ArrayBuffer | null = null;
  showComments = false;
  isSubmitting = false;
  isEditing = false;
  editContent = '';
  isEditingComment = false;
  editingCommentId: number | null = null;
  editCommentContent = '';
  highlightedCommentId: number | null = null;

  constructor(
    private postService: PostService,
    private authService: AuthService
  ) {
    this.postService.getPosts().subscribe(posts => {
      const updatedPost = posts.find(p => p.id === this.post?.id);
      if (updatedPost) {
        const currentShowComments = this.showComments;
        this.post = updatedPost;
        this.showComments = currentShowComments;
      }
    });
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  get canModifyPost(): boolean {
    return this.currentUser?.id === this.post.author.id || this.isAdmin;
  }

  get canModifyComment(): (comment: Comment) => boolean {
    return (comment: Comment) => 
      this.currentUser?.id === comment.author.id || this.isAdmin;
  }

  getStatusClass(): string {
    switch (this.post.status) {
      case PostStatus.JUST_POSTED:
        return 'just-posted';
      case PostStatus.FIRST_REACTIONS:
        return 'first-reactions';
      case PostStatus.EXPIRED:
        return 'expired';
      default:
        return '';
    }
  }

  getStatusText(): string {
    switch (this.post.status) {
      case PostStatus.JUST_POSTED:
        return 'Just Posted';
      case PostStatus.FIRST_REACTIONS:
        return 'First Reactions';
      case PostStatus.EXPIRED:
        return 'Expired';
      default:
        return '';
    }
  }

  onEditClick(): void {
    this.isEditing = true;
    this.editContent = this.post.content;
  }

  onDeleteClick(): void {
    if (confirm('Are you sure you want to delete this post?')) {
      this.onDelete.emit();
    }
  }

  saveEdit(): void {
    if (this.editContent.trim() && this.currentUser) {
      if (this.postService.editPost(this.post.id, this.editContent.trim())) {
        this.isEditing = false;
      }
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editContent = '';
  }

  onEditCommentClick(comment: Comment): void {
    this.isEditingComment = true;
    this.editingCommentId = comment.id;
    this.editCommentContent = comment.content;
  }

  saveCommentEdit(comment: Comment): void {
    if (this.editCommentContent.trim() && this.currentUser) {
      if (this.postService.editComment(this.post.id, comment.id, this.editCommentContent.trim())) {
        this.cancelCommentEdit();
      }
    }
  }

  cancelCommentEdit(): void {
    this.isEditingComment = false;
    this.editingCommentId = null;
    this.editCommentContent = '';
  }

  toggleComments(): void {
    if (!this.post.commentsDisabled) {
      this.showComments = !this.showComments;
    }
  }

  addComment(): void {
    if (!this.currentUser) {
      alert('Please log in to comment');
      return;
    }
    
    if (!this.newComment.trim() && !this.commentImage) {
      return;
    }

    this.isSubmitting = true;

    try {
      this.onComment.emit({
        postId: this.post.id.toString(),
        comment: this.newComment,
        imageUrl: this.commentImage as string | undefined
      });

      this.newComment = '';
      this.commentImage = null;
      
      this.showComments = true;
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      this.isSubmitting = false;
    }
  }

  deleteComment(comment: Comment): void {
    if (confirm('Are you sure you want to delete this comment?')) {
      const success = this.postService.deleteComment(this.post.id, comment.id, this.currentUser?.name || '');
      if (success) {
        const updatedPost = this.postService.getPost(this.post.id);
        if (updatedPost) {
          this.post = updatedPost;
          this.showComments = this.post.comments.length > 0;
        }
      }
    }
  }

  onCommentImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should not exceed 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.commentImage = e.target?.result || null;
      };
      reader.readAsDataURL(file);
    }
  }

  removeCommentImage(): void {
    this.commentImage = null;
  }

  isCurrentUserAuthor(authorId: string): boolean {
    const currentUser = this.authService.getCurrentUserValue();
    return currentUser?.id === authorId;
  }

  canVoteOnPost(): boolean {
    return !this.isCurrentUserAuthor(this.post.author.id);
  }

  canVoteOnComment(comment: Comment): boolean {
    return !this.isCurrentUserAuthor(comment.author.id);
  }

  likePost(): void {
    if (!this.currentUser) return;
    this.postService.likePost(this.post.id);
    const updatedPost = this.postService.getPost(this.post.id);
    if (updatedPost) {
      this.post = updatedPost;
    }
  }

  sharePost(): void {
    const postUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `Post by ${this.post.author.name}`,
        text: this.post.content,
        url: postUrl
      }).catch(console.error);
    } else {
      window.prompt('Copy link to share:', postUrl);
    }
  }

  likeComment(comment: Comment): void {
    if (!this.currentUser) return;
    this.postService.likeComment(this.post.id, comment.id, this.currentUser.name);
  }

  dislikeComment(comment: Comment): void {
    if (!this.currentUser) return;
    this.postService.dislikeComment(this.post.id, comment.id, this.currentUser.name);
  }

  get canShowComments(): boolean {
    return !this.post.commentsDisabled;
  }

  toggleCommentsAvailability(): void {
    if (this.isAdmin) {
      if (this.postService.toggleComments(this.post.id)) {
        if (this.post.commentsDisabled) {
          this.showComments = false;
        }
      }
    }
  }

  getAuthorScore(): number {
    const users = this.authService.getAllUsers();
    const author = users.find(u => u.id === this.post.author.id);
    return author?.score ?? 0;
  }

  getCommentAuthorScore(comment: Comment): number {
    const users = this.authService.getAllUsers();
    const author = users.find(u => u.id === comment.author.id);
    return author?.score ?? 0;
  }
}
