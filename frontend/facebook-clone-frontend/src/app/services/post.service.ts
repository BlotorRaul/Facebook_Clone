import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { AuthService } from './auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map, catchError, tap } from 'rxjs/operators';

export enum PostStatus {
  RECEIVED = 'RECEIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  JUST_POSTED = 'JUST_POSTED',
  FIRST_REACTIONS = 'FIRST_REACTIONS',
  EXPIRED = 'EXPIRED'
}

export interface Comment {
  id: number;
  author: {
    id: string;
    name: string;
    avatarUrl: string;
    score?: number;
  };
  content: string;
  imageUrl?: string;
  timePosted: string;
  likes: number;
  dislikes: number;
  likedBy: string[];
  dislikedBy: string[];
}

export interface Tag {
  id: number;
  name: string;
}

export interface Post {
  id: number;
  author: {
    id: string;
    name: string;
    avatarUrl: string;
    score?: number;
  };
  title?: string;
  content: string;
  imageUrl?: string;
  timePosted: string;
  status?: PostStatus;
  tags?: Tag[];
  comments: Comment[];
  likesCount: number;
  commentsCount: number;
  likedBy: string[];
  dislikedBy?: string[];
  commentsDisabled?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private postsSubject = new BehaviorSubject<Post[]>([]);
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.loadPosts();
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  public loadPosts(): void {
    console.log('Loading posts from backend...');
    this.http.get<any>(`${this.apiUrl}/posts`, { headers: this.getHeaders() }).subscribe(
      response => {
        let posts: Post[] = [];
        if (Array.isArray(response)) {
          posts = response;
        } else if (response && Array.isArray(response.posts)) {
          posts = response.posts;
          // poți salva și lista de useri blocați dacă e nevoie: response.blockedUsers
        }
        console.log('Posts loaded from backend:', posts);
        this.postsSubject.next(posts);
      },
      error => {
        console.error('Error loading posts:', error);
        this.postsSubject.next([]);
      }
    );
  }

  getPosts(): Observable<Post[]> {
    return this.postsSubject.asObservable();
  }

  addPost(post: Omit<Post, 'id' | 'timePosted' | 'status' | 'commentsDisabled'>): Observable<boolean> {
    console.log('Creating new post:', post);
    return this.http.post<Post>(`${this.apiUrl}/posts`, post, { headers: this.getHeaders() }).pipe(
      tap(newPost => {
        console.log('Post created successfully:', newPost);
        const currentPosts = this.postsSubject.value;
        const updatedPosts = [newPost, ...currentPosts];
        console.log('Updating posts list with:', updatedPosts);
        this.postsSubject.next(updatedPosts);
      }),
      map(() => true),
      catchError(error => {
        console.error('Error creating post:', error);
        return of(false);
      })
    );
  }

  deletePost(postId: number, currentUserName: string): Observable<boolean> {
    console.log('Deleting post:', postId);
    return this.http.delete(`${this.apiUrl}/posts/${postId}`, { headers: this.getHeaders() }).pipe(
      tap(() => {
        const currentPosts = this.postsSubject.value;
        const updatedPosts = currentPosts.filter(p => p.id !== postId);
        console.log('Updating posts list after deletion:', updatedPosts);
        this.postsSubject.next(updatedPosts);
      }),
      map(() => true),
      catchError(error => {
        console.error('Error deleting post:', error);
        return of(false);
      })
    );
  }

  addComment(postId: number, content: string, imageUrl?: string): Observable<boolean> {
    const currentUser = this.authService.getCurrentUserValue();
    if (!currentUser) {
      return of(false);
    }

    const comment = {
      author: {
        id: currentUser.id,
        name: currentUser.name,
        avatarUrl: currentUser.avatarUrl || ''
      },
      content,
      imageUrl
    };

    console.log('Adding comment to post:', postId, comment);
    return this.http.post<Post>(`${this.apiUrl}/posts/${postId}/comment`, comment, { headers: this.getHeaders() }).pipe(
      tap(updatedPost => {
        console.log('Comment added successfully:', updatedPost);
        const currentPosts = this.postsSubject.value;
        const postIndex = currentPosts.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
          currentPosts[postIndex] = updatedPost;
          console.log('Updating posts list after comment:', currentPosts);
          this.postsSubject.next([...currentPosts]);
        }
      }),
      map(() => true),
      catchError(error => {
        console.error('Error adding comment:', error);
        return of(false);
      })
    );
  }

  deleteComment(postId: number, commentId: number, currentUserName: string): Observable<boolean> {
    console.log('Deleting comment:', commentId, 'from post:', postId);
    return this.http.delete<Post>(`${this.apiUrl}/posts/${postId}/comment/${commentId}`, { headers: this.getHeaders() }).pipe(
      tap(updatedPost => {
        console.log('Comment deleted successfully:', updatedPost);
        const currentPosts = this.postsSubject.value;
        const postIndex = currentPosts.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
          currentPosts[postIndex] = updatedPost as Post;
          console.log('Updating posts list after comment deletion:', currentPosts);
          this.postsSubject.next([...currentPosts]);
        }
      }),
      map(() => true),
      catchError(error => {
        console.error('Error deleting comment:', error);
        return of(false);
      })
    );
  }

  likePost(postId: number): Observable<boolean> {
    const currentUser = this.authService.getCurrentUserValue();
    if (!currentUser) return of(false);
    return this.http.put<Post>(`${this.apiUrl}/posts/${postId}/like`, { user: currentUser.name }, { headers: this.getHeaders() }).pipe(
      tap(updatedPost => {
        const currentPosts = this.postsSubject.value;
        const postIndex = currentPosts.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
          currentPosts[postIndex] = updatedPost;
          this.postsSubject.next([...currentPosts]);
        }
      }),
      map(() => true),
      catchError(error => {
        return of(false);
      })
    );
  }

  dislikePost(postId: number): Observable<boolean> {
    const currentUser = this.authService.getCurrentUserValue();
    if (!currentUser) return of(false);
    return this.http.put<Post>(`${this.apiUrl}/posts/${postId}/dislike`, { user: currentUser.name }, { headers: this.getHeaders() }).pipe(
      tap(updatedPost => {
        const currentPosts = this.postsSubject.value;
        const postIndex = currentPosts.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
          currentPosts[postIndex] = updatedPost;
          this.postsSubject.next([...currentPosts]);
        }
      }),
      map(() => true),
      catchError(error => {
        return of(false);
      })
    );
  }

  likeComment(postId: number, commentId: number): Observable<boolean> {
    const currentUser = this.authService.getCurrentUserValue();
    if (!currentUser) return of(false);
    return this.http.put<Post>(`${this.apiUrl}/posts/${postId}/comment/${commentId}/like`, { user: currentUser.name }, { headers: this.getHeaders() }).pipe(
      tap(updatedPost => {
        const currentPosts = this.postsSubject.value;
        const postIndex = currentPosts.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
          currentPosts[postIndex] = updatedPost;
          this.postsSubject.next([...currentPosts]);
        }
      }),
      map(() => true),
      catchError(error => {
        return of(false);
      })
    );
  }

  dislikeComment(postId: number, commentId: number): Observable<boolean> {
    const currentUser = this.authService.getCurrentUserValue();
    if (!currentUser) return of(false);
    return this.http.put<Post>(`${this.apiUrl}/posts/${postId}/comment/${commentId}/dislike`, { user: currentUser.name }, { headers: this.getHeaders() }).pipe(
      tap(updatedPost => {
        const currentPosts = this.postsSubject.value;
        const postIndex = currentPosts.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
          currentPosts[postIndex] = updatedPost;
          this.postsSubject.next([...currentPosts]);
        }
      }),
      map(() => true),
      catchError(error => {
        return of(false);
      })
    );
  }

  unlikeComment(postId: number, commentId: number): Observable<boolean> {
    const currentUser = this.authService.getCurrentUserValue();
    if (!currentUser) return of(false);
    return this.http.put<Post>(`${this.apiUrl}/posts/${postId}/comment/${commentId}/unlike`, { user: currentUser.name }, { headers: this.getHeaders() }).pipe(
      tap(updatedPost => {
        const currentPosts = this.postsSubject.value;
        const postIndex = currentPosts.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
          currentPosts[postIndex] = updatedPost;
          this.postsSubject.next([...currentPosts]);
        }
      }),
      map(() => true),
      catchError(error => {
        return of(false);
      })
    );
  }

  undislikeComment(postId: number, commentId: number): Observable<boolean> {
    const currentUser = this.authService.getCurrentUserValue();
    if (!currentUser) return of(false);
    return this.http.put<Post>(`${this.apiUrl}/posts/${postId}/comment/${commentId}/undislike`, { user: currentUser.name }, { headers: this.getHeaders() }).pipe(
      tap(updatedPost => {
        const currentPosts = this.postsSubject.value;
        const postIndex = currentPosts.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
          currentPosts[postIndex] = updatedPost;
          this.postsSubject.next([...currentPosts]);
        }
      }),
      map(() => true),
      catchError(error => {
        return of(false);
      })
    );
  }

  getPost(postId: number): Observable<Post | undefined> {
    return new Observable<Post | undefined>(observer => {
      const post = this.postsSubject.value.find(p => p.id === postId);
      observer.next(post);
      observer.complete();
    });
  }

  editPost(postId: number, newContent: string): Observable<boolean> {
    console.log('Editing post:', postId, 'with content:', newContent);
    return this.http.put<Post>(`${this.apiUrl}/posts/${postId}/edit`, { content: newContent }, { headers: this.getHeaders() }).pipe(
      tap(updatedPost => {
        console.log('Post edited successfully:', updatedPost);
        const currentPosts = this.postsSubject.value;
        const postIndex = currentPosts.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
          currentPosts[postIndex] = updatedPost;
          console.log('Updating posts list after edit:', currentPosts);
          this.postsSubject.next([...currentPosts]);
        }
      }),
      map(() => true),
      catchError(error => {
        console.error('Error editing post:', error);
        return of(false);
      })
    );
  }

  editComment(postId: number, commentId: number, newContent: string): Observable<boolean> {
    console.log('Editing comment:', commentId, 'from post:', postId);
    return this.http.put<Post>(`${this.apiUrl}/posts/${postId}/comment/${commentId}/edit`, { content: newContent }, { headers: this.getHeaders() }).pipe(
      tap(updatedPost => {
        console.log('Comment edited successfully:', updatedPost);
        const currentPosts = this.postsSubject.value;
        const postIndex = currentPosts.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
          currentPosts[postIndex] = updatedPost;
          console.log('Updating posts list after comment edit:', currentPosts);
          this.postsSubject.next([...currentPosts]);
        }
      }),
      map(() => true),
      catchError(error => {
        console.error('Error editing comment:', error);
        return of(false);
      })
    );
  }

  toggleComments(postId: number): Observable<boolean> {
    console.log('Toggling comments for post:', postId);
    return this.http.put<Post>(`${this.apiUrl}/posts/${postId}/toggle-comments`, {}, { headers: this.getHeaders() }).pipe(
      tap(updatedPost => {
        console.log('Comments toggled successfully:', updatedPost);
        const currentPosts = this.postsSubject.value;
        const postIndex = currentPosts.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
          currentPosts[postIndex] = updatedPost;
          console.log('Updating posts list after toggle comments:', currentPosts);
          this.postsSubject.next([...currentPosts]);
        }
      }),
      map(() => true),
      catchError(error => {
        console.error('Error toggling comments:', error);
        return of(false);
      })
    );
  }

  uploadImage(file: File): Observable<string> {
    console.log('Uploading image:', file.name);
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ imageUrl: string }>(`${this.apiUrl}/posts/upload-image`, formData).pipe(
      map(response => {
        console.log('Image uploaded successfully:', response.imageUrl);
        return response.imageUrl;
      }),
      catchError(error => {
        console.error('Error uploading image:', error);
        return of('');
      })
    );
  }

  getTags(): Observable<any[]> {
    console.log('Getting all tags');
    return this.http.get<any[]>(`${this.apiUrl}/posts/tags`, { headers: this.getHeaders() });
  }

  createTag(name: string): Observable<any> {
    console.log('Creating new tag:', name);
    return this.http.post<any>(`${this.apiUrl}/posts/tags`, { name }, { headers: this.getHeaders() });
  }

  updatePostStatus(postId: number, status: string): Observable<boolean> {
    console.log('Updating post status:', postId, status);
    return this.http.put<Post>(`${this.apiUrl}/posts/${postId}/status`, { status }, { headers: this.getHeaders() }).pipe(
      tap(updatedPost => {
        console.log('Post status updated successfully:', updatedPost);
        const currentPosts = this.postsSubject.value;
        const postIndex = currentPosts.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
          currentPosts[postIndex] = updatedPost;
          console.log('Updating posts list after status change:', currentPosts);
          this.postsSubject.next([...currentPosts]);
        }
      }),
      map(() => true),
      catchError(error => {
        console.error('Error updating post status:', error);
        return of(false);
      })
    );
  }

  blockUser(userToBlock: string): Observable<any> {
    const currentUser = this.authService.getCurrentUserValue();
    if (!currentUser) return of(false);
    return this.http.post(`${this.apiUrl}/posts/block-user`, {
      user: userToBlock,
      requester: currentUser.name,
      role: currentUser.role
    }, { headers: this.getHeaders() });
  }

  unblockUser(userToUnblock: string): Observable<any> {
    const currentUser = this.authService.getCurrentUserValue();
    if (!currentUser) return of(false);
    return this.http.post(`${this.apiUrl}/posts/unblock-user`, {
      user: userToUnblock,
      requester: currentUser.name,
      role: currentUser.role
    }, { headers: this.getHeaders() });
  }
}
