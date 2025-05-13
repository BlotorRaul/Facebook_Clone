import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { PostComponent } from '../post/post.component';
import { PostService, Post, PostStatus, Tag } from '../../services/post.service';
import { AuthService, User } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

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
  posts: Post[] = [];
  filteredPosts: Post[] = [];
  newPostText: string = '';
  newPostTitle: string = '';
  selectedImage: string | ArrayBuffer | null = null;
  isSubmitting: boolean = false;
  isAdmin = false;
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
      imageUrl: 'assets/images/story1.jpg',
      userName: 'Tom Russo'
    },
    {
      imageUrl: 'assets/images/story2.jpg',
      userName: 'Anna Becklund'
    },
    {
      imageUrl: 'assets/images/story3.jpg',
      userName: 'Dennis Han'
    },
    {
      imageUrl: 'assets/images/story4.jpg',
      userName: 'Cynthia Lopez'
    }
  ];

  constructor(
    private userService: UserService,
    private postService: PostService,
    private authService: AuthService,
    private router: Router
  ) {
    // Check authentication immediately
    const currentUser = this.authService.getCurrentUserValue();
    if (!currentUser) {
      this.router.navigate(['/auth']);
      return;
    }
  }

  ngOnInit(): void {
    // Load contacts only if authenticated
    if (this.authService.getCurrentUserValue()) {
      this.contacts = this.userService.getContacts();
      
      // Subscribe to user changes
      this.userSubscription = this.authService.getCurrentUser().subscribe((user: User | null) => {
        this.currentUser = user;
        this.isAdmin = this.authService.isAdmin();
        if (!user) {
          this.router.navigate(['/auth']);
        }
      });
      
      // Subscribe to posts
      this.postService.getPosts().subscribe(posts => {
        this.posts = posts;
        this.applyFilters();
      });
    }
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

      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedImage = e.target?.result || null;
      };
      reader.readAsDataURL(file);
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

    try {
      if (this.postService.addPost(post)) {
        this.newPostText = '';
        this.newPostTitle = '';
        this.selectedImage = null;
        this.selectedTags = [];
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    } finally {
      this.isSubmitting = false;
    }
  }

  deletePost(postId: string): void {
    if (this.currentUser) {
      this.postService.deletePost(Number(postId), this.currentUser.name);
    }
  }

  logout(): void {
    this.authService.logout();
  }

  addComment(data: { postId: string; comment: string; imageUrl?: string }): void {
    if (!this.currentUser) {
      alert('Please log in to comment');
      return;
    }

    const success = this.postService.addComment(
      Number(data.postId),
      data.comment,
      data.imageUrl
    );

    if (success) {
      // Update the specific post in the posts list
      const postIndex = this.posts.findIndex(p => p.id === Number(data.postId));
      if (postIndex !== -1) {
        const updatedPost = this.postService.getPost(Number(data.postId));
        if (updatedPost) {
          this.posts[postIndex] = updatedPost;
        }
      }
    }
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
    let filtered = [...this.posts];

    // Filter by title
    if (this.searchTitle) {
      const searchLower = this.searchTitle.toLowerCase();
      filtered = filtered.filter(post => 
        post.title?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by tag
    if (this.filterTag) {
      const tagLower = this.filterTag.toLowerCase();
      filtered = filtered.filter(post => 
        post.tags?.some(tag => tag.name.toLowerCase().includes(tagLower))
      );
    }

    // Filter by user
    if (this.filterUser) {
      const userLower = this.filterUser.toLowerCase();
      filtered = filtered.filter(post => 
        post.author.name.toLowerCase().includes(userLower)
      );
    }

    // Filter my posts
    if (this.showOnlyMyPosts && this.currentUser) {
      filtered = filtered.filter(post => 
        post.author.id === this.currentUser?.id
      );
    }

    this.filteredPosts = filtered;
  }
}
