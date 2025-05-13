import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';

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
  commentsDisabled?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private posts: Post[] = [];
  private postsSubject = new BehaviorSubject<Post[]>([]);
  private readonly POSTS_STORAGE_KEY = 'facebook_clone_posts';

  constructor(private authService: AuthService) {
    this.loadPostsFromStorage();
  }

  private loadPostsFromStorage(): void {
    try {
      const savedPosts = localStorage.getItem(this.POSTS_STORAGE_KEY);
      if (savedPosts) {
        this.posts = JSON.parse(savedPosts);
        this.postsSubject.next([...this.posts]);
      }
    } catch (error) {
      console.error('Error loading posts from storage:', error);
      this.posts = [];
      this.postsSubject.next([]);
    }
  }

  private savePostsToStorage(): void {
    try {
      localStorage.setItem(this.POSTS_STORAGE_KEY, JSON.stringify(this.posts));
      this.postsSubject.next(this.posts.slice());
    } catch (error) {
      console.error('Error saving posts to storage:', error);
      throw new Error('Failed to save posts');
    }
  }

  getPosts(): Observable<Post[]> {
    return this.postsSubject.asObservable();
  }

  addPost(post: Omit<Post, 'id' | 'timePosted' | 'status' | 'commentsDisabled'>): boolean {
    if (!this.authService.getCurrentUserValue()) return false;

    const newPost: Post = {
      ...post,
      id: this.posts.length + 1,
      timePosted: new Date().toISOString(),
      status: PostStatus.JUST_POSTED,
      commentsDisabled: false,
      comments: [],
      likesCount: 0,
      commentsCount: 0,
      likedBy: []
    };

    this.posts.unshift(newPost);
    this.savePostsToStorage();
    this.postsSubject.next([...this.posts]);
    return true;
  }

  deletePost(postId: number, currentUserName: string): boolean {
    try {
      const postIndex = this.posts.findIndex(p => p.id === postId);
      if (postIndex === -1) {
        console.error('Post not found:', postId);
        return false;
      }

      const post = this.posts[postIndex];
      
      if (!this.authService.hasPermission('delete', post.author.id)) {
        console.error('User not authorized to delete this post');
        return false;
      }

      this.posts.splice(postIndex, 1);
      this.savePostsToStorage();
      
      console.log('Post deleted successfully:', postId);
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      return false;
    }
  }

  private sortComments(comments: Comment[]): void {
    comments.sort((a, b) => {
      const scoreA = a.likes - a.dislikes;
      const scoreB = b.likes - b.dislikes;

      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }

      return new Date(b.timePosted).getTime() - new Date(a.timePosted).getTime();
    });
  }

  addComment(postId: number, content: string, imageUrl?: string): boolean {
    const currentUser = this.authService.getCurrentUserValue();
    if (!currentUser) return false;

    const post = this.posts.find(p => p.id === postId);
    if (!post || post.commentsDisabled) return false;

    const comment: Comment = {
      id: post.comments.length + 1,
      author: {
        id: currentUser.id,
        name: currentUser.name,
        avatarUrl: currentUser.avatarUrl || ''
      },
      content,
      timePosted: new Date().toISOString(),
      imageUrl,
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: []
    };

    post.comments.push(comment);
    post.commentsCount = post.comments.length;

    if (post.comments.length === 1) {
      post.status = PostStatus.FIRST_REACTIONS;
    }

    this.sortComments(post.comments);

    this.savePostsToStorage();
    this.postsSubject.next([...this.posts]);
    return true;
  }

  deleteComment(postId: number, commentId: number, currentUserName: string): boolean {
    try {
      const postIndex = this.posts.findIndex(p => p.id === postId);
      if (postIndex === -1) {
        console.error('Post not found:', postId);
        return false;
      }

      const post = JSON.parse(JSON.stringify(this.posts[postIndex]));

      const commentIndex = post.comments.findIndex((c: Comment) => c.id === commentId);
      if (commentIndex === -1) {
        console.error('Comment not found:', commentId);
        return false;
      }

      const comment = post.comments[commentIndex];

      if (!this.authService.hasPermission('delete', comment.author.id)) {
        console.error('User not authorized to delete this comment');
        return false;
      }

      post.comments.splice(commentIndex, 1);
      post.commentsCount = post.comments.length;

      this.posts[postIndex] = post;
      
      this.savePostsToStorage();
      
      console.log('Comment deleted successfully:', commentId);
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  }

  dislikePost(postId: number): boolean {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return false;

    const currentUser = this.authService.getCurrentUserValue();
    if (!currentUser) return false;

    if (post.author.id === currentUser.id) {
      return false;
    }

    if (post.likedBy.includes(currentUser.name)) {
      const userIndex = post.likedBy.indexOf(currentUser.name);
      post.likedBy.splice(userIndex, 1);
      post.likesCount--;
      this.authService.updateScoreForPostVote(post.author.id, false);
      this.authService.updateScoreForPostVote(post.author.id, false);
    } else {
      if (post.likesCount < 0) {
        this.authService.updateScoreForPostVote(post.author.id, true);
      } else {
        this.authService.updateScoreForPostVote(post.author.id, false);
      }
      post.likesCount--;
    }

    this.savePostsToStorage();
    this.postsSubject.next([...this.posts]);
    return true;
  }

  likePost(postId: number): boolean {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return false;

    const currentUser = this.authService.getCurrentUserValue();
    if (!currentUser) return false;

    if (post.author.id === currentUser.id) {
      return false;
    }

    const userIndex = post.likedBy.indexOf(currentUser.name);
    if (userIndex === -1) {
      post.likedBy.push(currentUser.name);
      post.likesCount++;
      this.authService.updateScoreForPostVote(post.author.id, true);
    } else {
      post.likedBy.splice(userIndex, 1);
      post.likesCount--;
      this.authService.updateScoreForPostVote(post.author.id, false);
    }

    this.savePostsToStorage();
    this.postsSubject.next([...this.posts]);
    return true;
  }

  getPost(postId: number): Post | undefined {
    return this.posts.find(p => p.id === postId);
  }

  clearStorage(): void {
    localStorage.removeItem(this.POSTS_STORAGE_KEY);
    this.posts = [];
    this.postsSubject.next([]);
  }

  likeComment(postId: number, commentId: number, currentUserName: string): boolean {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return false;

    const comment = post.comments.find(c => c.id === commentId);
    if (!comment) return false;

    if (comment.author.name === currentUserName) {
      return false;
    }

    const currentUser = this.authService.getCurrentUserValue();
    if (!currentUser) return false;

    if (comment.likedBy.includes(currentUserName)) {
      comment.likes--;
      const userIndex = comment.likedBy.indexOf(currentUserName);
      if (userIndex !== -1) {
        comment.likedBy.splice(userIndex, 1);
      }
      this.authService.updateScoreForCommentVote(comment.author.id, false);
    } 
    else if (comment.dislikedBy.includes(currentUserName)) {
      comment.dislikes--;
      const userIndex = comment.dislikedBy.indexOf(currentUserName);
      if (userIndex !== -1) {
        comment.dislikedBy.splice(userIndex, 1);
      }
      this.authService.updateScoreForCommentVote(comment.author.id, true);
      this.authService.updateScoreForDownvotingComment(currentUser.id, true);

      comment.likes++;
      comment.likedBy.push(currentUserName);
      this.authService.updateScoreForCommentVote(comment.author.id, true);
    }
    else {
      comment.likes++;
      comment.likedBy.push(currentUserName);
      this.authService.updateScoreForCommentVote(comment.author.id, true);
    }

    this.sortComments(post.comments);
    this.savePostsToStorage();
    this.postsSubject.next([...this.posts]);
    return true;
  }

  dislikeComment(postId: number, commentId: number, currentUserName: string): boolean {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return false;

    const comment = post.comments.find(c => c.id === commentId);
    if (!comment) return false;

    if (comment.author.name === currentUserName) {
      return false;
    }

    const currentUser = this.authService.getCurrentUserValue();
    if (!currentUser) return false;

    if (comment.dislikedBy.includes(currentUserName)) {
      comment.dislikes--;
      const userIndex = comment.dislikedBy.indexOf(currentUserName);
      if (userIndex !== -1) {
        comment.dislikedBy.splice(userIndex, 1);
      }
      this.authService.updateScoreForCommentVote(comment.author.id, true);
      this.authService.updateScoreForDownvotingComment(currentUser.id, true);
    } 
    else if (comment.likedBy.includes(currentUserName)) {
      comment.likes--;
      const userIndex = comment.likedBy.indexOf(currentUserName);
      if (userIndex !== -1) {
        comment.likedBy.splice(userIndex, 1);
      }

      comment.dislikes++;
      comment.dislikedBy.push(currentUserName);
      
      this.authService.updateScoreForCommentVote(comment.author.id, false);
      this.authService.updateScoreForDownvotingComment(currentUser.id);
    }
    else {
      comment.dislikes++;
      comment.dislikedBy.push(currentUserName);
      this.authService.updateScoreForCommentVote(comment.author.id, false);
      this.authService.updateScoreForDownvotingComment(currentUser.id);
    }

    this.sortComments(post.comments);
    this.savePostsToStorage();
    this.postsSubject.next([...this.posts]);
    return true;
  }

  editPost(postId: number, newContent: string): boolean {
    try {
      const postIndex = this.posts.findIndex(p => p.id === postId);
      if (postIndex === -1) return false;

      const post = this.posts[postIndex];

      if (!this.authService.hasPermission('edit', post.author.id)) {
        console.error('User not authorized to edit this post');
        return false;
      }

      this.posts[postIndex] = {
        ...post,
        content: newContent
      };

      this.savePostsToStorage();
      return true;
    } catch (error) {
      console.error('Error editing post:', error);
      return false;
    }
  }

  editComment(postId: number, commentId: number, newContent: string): boolean {
    try {
      const postIndex = this.posts.findIndex(p => p.id === postId);
      if (postIndex === -1) return false;

      const post = JSON.parse(JSON.stringify(this.posts[postIndex]));
      const commentIndex = post.comments.findIndex((c: Comment) => c.id === commentId);
      if (commentIndex === -1) return false;

      const comment = post.comments[commentIndex];

      if (!this.authService.hasPermission('edit', comment.author.id)) {
        console.error('User not authorized to edit this comment');
        return false;
      }

      post.comments[commentIndex] = {
        ...comment,
        content: newContent
      };

      this.posts[postIndex] = post;
      this.savePostsToStorage();
      return true;
    } catch (error) {
      console.error('Error editing comment:', error);
      return false;
    }
  }

  toggleComments(postId: number): boolean {
    try {
      const postIndex = this.posts.findIndex(p => p.id === postId);
      if (postIndex === -1) return false;

      const post = this.posts[postIndex];

      if (!this.authService.hasPermission('admin', post.author.id)) {
        console.error('User not authorized to toggle comments');
        return false;
      }

      post.commentsDisabled = !post.commentsDisabled;
      
      if (post.commentsDisabled) {
        post.status = PostStatus.EXPIRED;
      }
      
      this.savePostsToStorage();
      
      return true;
    } catch (error) {
      console.error('Error toggling comments:', error);
      return false;
    }
  }
}
