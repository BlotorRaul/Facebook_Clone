import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { PostComponent } from '../post/post.component';
import { PostService, Post, PostStatus, Tag } from '../../services/post.service';
import { AuthService, User } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Subscription, Observable, map } from 'rxjs';

interface Story {
  imageUrl: string;
  userName: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, PostComponent, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  contacts: any[] = [];
  currentUser: User | null = null;
  posts$: Observable<Post[]>;
  filteredPosts$: Observable<Post[]>;
  newPostText: string = '';
  newPostTitle: string = '';
  newComment: string = '';
  selectedImage: string | ArrayBuffer | null = null;
  isSubmitting: boolean = false;
  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }
  private userSubscription?: Subscription;
  postStatuses = Object.values(PostStatus);
  selectedStatus: PostStatus = PostStatus.RECEIVED;
  newTag: string = '';
  selectedTags: Tag[] = [];
  availableTags: Tag[] = [];

  // Filtering
  searchTitle: string = '';
  filterTag: string = '';
  filterUser: string = '';
  showOnlyMyPosts: boolean = false;

  stories: Story[] = [
    {
      imageUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
      userName: 'Tom Russo'
    },
    {
      imageUrl: 'https://randomuser.me/api/portraits/women/2.jpg',
      userName: 'Anna Becklund'
    },
    {
      imageUrl: 'https://randomuser.me/api/portraits/men/3.jpg',
      userName: 'Dennis Han'
    },
    {
      imageUrl: 'https://randomuser.me/api/portraits/women/4.jpg',
      userName: 'Cynthia Lopez'
    }
  ];

  constructor(
    private userService: UserService,
    private postService: PostService,
    private authService: AuthService,
    private router: Router
  ) {
    this.posts$ = this.postService.getPosts();
    this.filteredPosts$ = this.posts$;
    this.currentUser = this.authService.getCurrentUserValue();
  }

  ngOnInit(): void {
    this.postService.loadPosts();
    if (!this.currentUser) {
      this.router.navigate(['/auth']);
      return;
    }
    console.log('HomeComponent initialized');
    this.posts$.subscribe(posts => {
      console.log('Posts received in HomeComponent:', posts);
      if (!Array.isArray(posts) || posts.length === 0) {
        console.log('No posts found or invalid data, refreshing...');
        this.refreshPosts();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('File size should not exceed 5MB');
        return;
      }

      this.isSubmitting = true;
      this.postService.uploadImage(file).subscribe(
        imageUrl => {
          if (imageUrl) {
            this.selectedImage = imageUrl;
          } else {
            alert('Failed to upload image');
          }
        },
        error => {
          console.error('Error uploading image:', error);
          alert('Failed to upload image');
        },
        () => {
          this.isSubmitting = false;
        }
      );
    }
  }

  removeImage(): void {
    this.selectedImage = null;
  }

  createPost(): void {
    if (!this.currentUser) {
      alert('Please log in to create a post');
      return;
    }

    if ((!this.newPostText && !this.selectedImage) || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    console.log('Creating new post with data:', {
      author: this.currentUser,
      title: this.newPostTitle,
      content: this.newPostText,
      imageUrl: this.selectedImage,
      tags: this.selectedTags
    });

    const post = {
      author: {
        id: this.currentUser.id,
        name: this.currentUser.name,
        avatarUrl: this.currentUser.avatarUrl || ''
      },
      title: this.newPostTitle,
      content: this.newPostText,
      imageUrl: this.selectedImage as string | undefined,
      tags: this.selectedTags,
      comments: [],
      likesCount: 0,
      commentsCount: 0,
      likedBy: []
    };

    this.postService.addPost(post).subscribe(
      success => {
        if (success) {
          console.log('Post created successfully');
          this.newPostText = '';
          this.newPostTitle = '';
          this.selectedImage = null;
          this.selectedTags = [];
          this.refreshPosts();
        } else {
          console.error('Failed to create post');
          alert('Failed to create post');
        }
      },
      error => {
        console.error('Error creating post:', error);
        alert('Failed to create post');
      },
      () => {
        this.isSubmitting = false;
      }
    );
  }

  deletePost(postId: string): void {
    if (this.currentUser) {
      console.log('Deleting post:', postId);
      this.postService.deletePost(Number(postId), this.currentUser.name).subscribe(
        success => {
          if (success) {
            console.log('Post deleted successfully');
          } else {
            console.error('Failed to delete post');
            alert('Failed to delete post');
          }
        }
      );
    }
  }

  logout(): void {
    this.authService.logout();
  }

  likePost(postId: number): void {
    console.log('Liking post:', postId);
    this.postService.likePost(postId).subscribe(
      success => {
        if (success) {
          console.log('Post liked successfully');
          this.posts$ = this.postService.getPosts();
        } else {
          console.error('Failed to like post');
          alert('Failed to like post');
        }
      }
    );
  }

  toggleComments(postId: number): void {
    console.log('Toggling comments for post:', postId);
    this.postService.toggleComments(postId).subscribe(
      success => {
        if (success) {
          console.log('Comments toggled successfully');
          this.posts$ = this.postService.getPosts();
        } else {
          console.error('Failed to toggle comments');
          alert('Failed to toggle comments');
        }
      }
    );
  }

  hasPermission(action: 'delete' | 'edit' | 'admin', resourceOwnerId: string): boolean {
    return this.authService.hasPermission(action, resourceOwnerId);
  }

  addComment(postId: number, comment: string): void {
    if (!this.currentUser) return;
    
    console.log('Adding comment to post:', postId, comment);
    this.postService.addComment(postId, comment).subscribe(
      success => {
        if (success) {
          console.log('Comment added successfully');
          this.posts$ = this.postService.getPosts();
          this.newComment = '';
        } else {
          console.error('Failed to add comment');
          alert('Failed to add comment');
        }
      }
    );
  }

  editComment(postId: number, commentId: number, content: string): void {
    console.log('Editing comment:', commentId, 'from post:', postId);
    this.postService.editComment(postId, commentId, content).subscribe(
      success => {
        if (success) {
          console.log('Comment edited successfully');
          this.posts$ = this.postService.getPosts();
        } else {
          console.error('Failed to edit comment');
          alert('Failed to edit comment');
        }
      }
    );
  }

  deleteComment(postId: number, commentId: number): void {
    if (!this.currentUser) return;
    console.log('Deleting comment:', commentId, 'from post:', postId);
    this.postService.deleteComment(postId, commentId, this.currentUser.name).subscribe(
      success => {
        if (success) {
          console.log('Comment deleted successfully');
          this.posts$ = this.postService.getPosts();
        } else {
          console.error('Failed to delete comment');
          alert('Failed to delete comment');
        }
      }
    );
  }

  addTag(): void {
    if (!this.newTag.trim()) return;

    const newTag: Tag = {
      id: Date.now(),
      name: this.newTag.trim()
    };

    if (!this.selectedTags.some(tag => tag.name.toLowerCase() === newTag.name.toLowerCase())) {
      this.selectedTags.push(newTag);
    }
    
    this.newTag = '';
  }

  removeTag(tagToRemove: Tag): void {
    this.selectedTags = this.selectedTags.filter(tag => tag.id !== tagToRemove.id);
  }

  applyFilters(): void {
    console.log('Applying filters:', {
      searchTitle: this.searchTitle,
      filterTag: this.filterTag,
      filterUser: this.filterUser,
      showOnlyMyPosts: this.showOnlyMyPosts
    });

    this.filteredPosts$ = this.posts$.pipe(
      map(posts => {
        let filtered = [...posts];

        if (this.searchTitle) {
          const searchLower = this.searchTitle.toLowerCase();
          filtered = filtered.filter(post => 
            post.title?.toLowerCase().includes(searchLower)
          );
        }

        if (this.filterTag) {
          const tagLower = this.filterTag.toLowerCase();
          filtered = filtered.filter(post => 
            post.tags?.some(tag => tag.name.toLowerCase().includes(tagLower))
          );
        }

        if (this.filterUser) {
          const userLower = this.filterUser.toLowerCase();
          filtered = filtered.filter(post => 
            post.author.name.toLowerCase().includes(userLower)
          );
        }

        if (this.showOnlyMyPosts && this.currentUser) {
          filtered = filtered.filter(post => 
            post.author.id === this.currentUser?.id
          );
        }

        console.log('Filtered posts:', filtered);
        return filtered;
      })
    );
  }

  onPostUpdated(post: Post): void {
    console.log('Post updated:', post);
    this.refreshPosts();
  }

  onCommentAdded(post: Post): void {
    console.log('Comment added to post:', post);
    this.refreshPosts();
  }

  onCommentDeleted(post: Post): void {
    console.log('Comment deleted from post:', post);
    this.refreshPosts();
  }

  onCommentUpdated(post: Post): void {
    console.log('Comment updated in post:', post);
    this.refreshPosts();
  }

  refreshPosts(): void {
    console.log('Refreshing posts');
    this.posts$ = this.postService.getPosts();
    this.applyFilters();
  }
}
