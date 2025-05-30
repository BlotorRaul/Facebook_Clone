import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Post, Comment, PostService, PostStatus } from '../../services/post.service';
import { User, AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of, map, switchMap, filter } from 'rxjs';

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post.component.html',
  styleUrl: './post.component.css'
})
export class PostComponent implements OnInit {
  @Input() post!: Post;
  @Input() currentUser: User | null = null;
  @Output() postUpdated = new EventEmitter<Post>();
  @Output() commentAdded = new EventEmitter<Post>();
  @Output() commentDeleted = new EventEmitter<Post>();
  @Output() commentUpdated = new EventEmitter<Post>();
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
  selectedCommentFile: File | null = null;
  commentImagePreview: string | ArrayBuffer | null = null;

  post$: Observable<Post>;
  users$: Observable<User[]>;

  PostStatus = PostStatus;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private postService: PostService,
    private authService: AuthService
  ) {
    this.post$ = this.route.params.pipe(
      map(params => params['id']),
      switchMap(id => this.postService.getPost(Number(id))),
      filter((post): post is Post => post !== undefined)
    );
    this.users$ = this.authService.getAllUsers();
    this.currentUser = this.authService.getCurrentUserValue();
  }

  ngOnInit(): void {
    if (!this.currentUser) {
      this.router.navigate(['/auth']);
    }
    if (this.post) {
      this.sortComments();
    }
  }

  private sortComments(): void {
    if (this.post && this.post.comments) {
      this.post.comments.sort((a, b) => {
        const scoreA = (a.likes || 0) - (a.dislikes || 0);
        const scoreB = (b.likes || 0) - (b.dislikes || 0);
        return scoreB - scoreA;
      });
    }
  }

  onPostUpdated(updatedPost: Post): void {
    this.post$ = this.postService.getPost(updatedPost.id).pipe(
      filter((post): post is Post => post !== undefined)
    );
    this.postUpdated.emit(updatedPost);
  }

  onCommentAdded(): void {
    this.refreshPost();
    this.commentAdded.emit(this.post);
  }

  onCommentDeleted(): void {
    this.refreshPost();
    this.commentDeleted.emit(this.post);
  }

  onCommentUpdated(): void {
    this.refreshPost();
    this.commentUpdated.emit(this.post);
  }

  getAuthorName(authorId: string): Observable<string> {
    return this.users$.pipe(
      map(users => {
        const author = users.find(u => u.id === authorId);
        return author ? author.name : 'Unknown User';
      })
    );
  }

  getCommentAuthorName(authorId: string): Observable<string> {
    return this.users$.pipe(
      map(users => {
        const author = users.find(u => u.id === authorId);
        return author ? author.name : 'Unknown User';
      })
    );
  }

  hasPermission(action: 'delete' | 'edit' | 'admin', resourceOwnerId: string): boolean {
    return this.authService.hasPermission(action, resourceOwnerId);
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
      this.postService.deletePost(this.post.id, this.currentUser?.name || '').subscribe(success => {
        if (success) {
          window.location.reload();
        } else {
          alert('Eroare la ștergerea postării!');
        }
      });
    }
  }

  saveEdit(): void {
    if (this.editContent.trim() && this.currentUser) {
      this.postService.editPost(this.post.id, this.editContent.trim()).subscribe(success => {
        if (success) {
          this.isEditing = false;
          this.editContent = '';
          this.refreshPost();
        } else {
          alert('Eroare la editarea postării!');
        }
      });
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
      this.postService.editComment(this.post.id, comment.id, this.editCommentContent.trim())
        .subscribe((success: boolean) => {
          if (success) {
            this.cancelCommentEdit();
            this.refreshPost();
          }
        });
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

  onCommentImageSelected(event: any): void {
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
      this.selectedCommentFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.commentImagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeCommentImage(): void {
    this.selectedCommentFile = null;
    this.commentImagePreview = null;
  }

  addComment(): void {
    if (!this.currentUser) {
      alert('Please log in to comment');
      return;
    }
    if (!this.newComment.trim() && !this.selectedCommentFile) {
      return;
    }
    this.isSubmitting = true;

    const submitComment = (imageUrl?: string) => {
      this.postService.addComment(this.post.id, this.newComment, imageUrl).subscribe({
        next: (success) => {
          if (success) {
            this.newComment = '';
            this.selectedCommentFile = null;
            this.commentImagePreview = null;
            this.showComments = true;
          } else {
            alert('Failed to add comment. Please try again.');
          }
          this.isSubmitting = false;
        },
        error: () => {
          alert('Failed to add comment. Please try again.');
          this.isSubmitting = false;
        }
      });
    };

    if (this.selectedCommentFile) {
      this.postService.uploadImage(this.selectedCommentFile).subscribe({
        next: (imageUrl) => submitComment(imageUrl),
        error: () => {
          alert('Failed to upload image!');
          this.isSubmitting = false;
        }
      });
    } else {
      submitComment();
    }
  }

  deleteComment(comment: Comment): void {
    if (confirm('Are you sure you want to delete this comment?')) {
      this.postService.deleteComment(this.post.id, comment.id, this.currentUser?.name || '').subscribe(success => {
        if (success) {
          this.refreshPost();
        } else {
          alert('Eroare la ștergerea comentariului!');
        }
      });
    }
  }

  editComment(comment: Comment): void {
    this.isEditingComment = true;
    this.editingCommentId = comment.id;
    this.editCommentContent = comment.content;
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

  canDislikePost(): boolean {
    return !!(this.currentUser && this.post.likedBy && !this.post.likedBy.includes(this.currentUser.name));
  }

  likePost(): void {
    if (!this.currentUser) return;
    this.postService.likePost(this.post.id).subscribe();
  }

  dislikePost(): void {
    if (!this.currentUser) return;
    this.postService.dislikePost(this.post.id).subscribe();
  }

  likeComment(comment: Comment): void {
    if (!this.currentUser) return;
    if (this.hasLikedComment(comment)) {
      this.postService.unlikeComment(this.post.id, comment.id).subscribe(() => {
        this.sortComments();
      });
    } else {
      if (this.hasDislikedComment(comment)) {
        this.postService.undislikeComment(this.post.id, comment.id).subscribe(() => {
          this.postService.likeComment(this.post.id, comment.id).subscribe(() => {
            this.sortComments();
          });
        });
      } else {
        this.postService.likeComment(this.post.id, comment.id).subscribe(() => {
          this.sortComments();
        });
      }
    }
  }

  dislikeComment(comment: Comment): void {
    if (!this.currentUser) return;
    if (this.hasDislikedComment(comment)) {
      this.postService.undislikeComment(this.post.id, comment.id).subscribe(() => {
        this.sortComments();
      });
    } else {
      if (this.hasLikedComment(comment)) {
        this.postService.unlikeComment(this.post.id, comment.id).subscribe(() => {
          this.postService.dislikeComment(this.post.id, comment.id).subscribe(() => {
            this.sortComments();
          });
        });
      } else {
        this.postService.dislikeComment(this.post.id, comment.id).subscribe(() => {
          this.sortComments();
        });
      }
    }
  }

  hasLikedComment(comment: Comment): boolean {
    return !!(this.currentUser && comment.likedBy && comment.likedBy.includes(this.currentUser.name));
  }

  hasDislikedComment(comment: Comment): boolean {
    return !!(this.currentUser && comment.dislikedBy && comment.dislikedBy.includes(this.currentUser.name));
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

  get canShowComments(): boolean {
    return !this.post.commentsDisabled;
  }

  toggleCommentsAvailability(): void {
    if (this.isAdmin) {
      this.postService.toggleComments(this.post.id).subscribe(success => {
        if (success) {
          this.post.commentsDisabled = !this.post.commentsDisabled;
          if (this.post.commentsDisabled) {
            this.post.status = PostStatus.RESOLVED;
            this.updateStatus();
          }
        }
      });
    }
  }

  getAuthorScore(): Observable<number> {
    return this.users$.pipe(
      map(users => {
        const author = users.find(u => u.id === this.post.author.id);
        return author?.score ?? 0;
      })
    );
  }

  getCommentAuthorScore(comment: Comment): Observable<number> {
    return this.users$.pipe(
      map(users => {
        const author = users.find(u => u.id === comment.author.id);
        return author?.score ?? 0;
      })
    );
  }

  private refreshPost(): void {
    this.post$ = this.route.params.pipe(
      map(params => params['id']),
      switchMap(id => this.postService.getPost(Number(id))),
      filter((post): post is Post => post !== undefined)
    );
  }

  getStatusLabel(status: PostStatus | undefined): string {
    if (!status) return 'Primită';
    
    switch (status) {
      case PostStatus.JUST_POSTED:
        return 'Primită';
      case PostStatus.IN_PROGRESS:
        return 'În curs de rezolvare';
      case PostStatus.RESOLVED:
        return 'Rezolvată';
      case PostStatus.FIRST_REACTIONS:
        return 'Primele reacții';
      case PostStatus.EXPIRED:
        return 'Expirată';
      default:
        return 'Primită';
    }
  }

  updateStatus(): void {
    if (!this.post || !this.currentUser) return;
    
    const status = this.post.status || 'JUST_POSTED';
    this.postService.updatePostStatus(this.post.id, status).subscribe({
      next: (success) => {
        if (success) {
          console.log('Post status updated successfully');
        } else {
          console.error('Failed to update post status');
        }
      },
      error: (error) => {
        console.error('Error updating post status:', error);
      }
    });
  }

  getImageUrl(imageUrl: string | undefined): string | undefined {
    if (!imageUrl) return undefined;
    if (imageUrl.startsWith('/uploads/')) {
      return 'http://localhost:8080' + imageUrl;
    }
    return imageUrl;
  }
}
