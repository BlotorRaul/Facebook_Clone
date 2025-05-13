import { TestBed } from '@angular/core/testing';
import { PostService } from './post.service';
import { AuthService } from './auth.service';
import { Post, PostStatus } from './post.service';

describe('PostService', () => {
  let service: PostService;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getCurrentUserValue',
      'updateScoreForPostVote'
    ]);

    TestBed.configureTestingModule({
      providers: [
        PostService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(PostService);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('likePost', () => {
    let mockUser: any;
    let mockPost: Post;

    beforeEach(() => {
      mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
        avatarUrl: 'test.jpg',
        role: 'user' as const,
        isBanned: false,
        phone: '',
        score: 0
      };

      mockPost = {
        id: 1,
        author: {
          id: '2',
          name: 'Post Author',
          avatarUrl: 'author.jpg'
        },
        content: 'Test post',
        timePosted: new Date().toISOString(),
        comments: [],
        likesCount: 0,
        commentsCount: 0,
        likedBy: []
      };

      (service as any).posts = [mockPost];
      (service as any).postsSubject.next([mockPost]);
    });

    it('should add like to post when user has not liked it before', () => {
      authService.getCurrentUserValue.and.returnValue(mockUser);
      authService.updateScoreForPostVote.and.returnValue(true);

      const result = service.likePost(mockPost.id);

      expect(result).toBeTrue();
      expect(mockPost.likesCount).toBe(1);
      expect(mockPost.likedBy).toContain(mockUser.name);
      expect(authService.updateScoreForPostVote).toHaveBeenCalledWith(mockPost.author.id, true);
    });

    it('should remove like from post when user has already liked it', () => {
      mockPost.likesCount = 1;
      mockPost.likedBy = [mockUser.name];

      authService.getCurrentUserValue.and.returnValue(mockUser);
      authService.updateScoreForPostVote.and.returnValue(true);

      const result = service.likePost(mockPost.id);

      expect(result).toBeTrue();
      expect(mockPost.likesCount).toBe(0);
      expect(mockPost.likedBy).not.toContain(mockUser.name);
      expect(authService.updateScoreForPostVote).toHaveBeenCalledWith(mockPost.author.id, false);
    });

    it('should not allow user to like their own post', () => {
      mockPost.author.id = mockUser.id;
      mockPost.author.name = mockUser.name;

      authService.getCurrentUserValue.and.returnValue(mockUser);

      const result = service.likePost(mockPost.id);

      expect(result).toBeFalse();
      expect(mockPost.likesCount).toBe(0);
      expect(mockPost.likedBy).not.toContain(mockUser.name);
      expect(authService.updateScoreForPostVote).not.toHaveBeenCalled();
    });
  });
});
