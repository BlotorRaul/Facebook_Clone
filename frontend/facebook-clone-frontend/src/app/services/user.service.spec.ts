import { TestBed } from '@angular/core/testing';

import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return contacts list', () => {
    const contacts = service.getContacts();
    expect(contacts.length).toBe(4);
    expect(contacts[0].name).toBe('Dennis Han');
  });

  it('should return current user', () => {
    const user = service.getCurrentUser();
    expect(user.name).toBe('Current User');
    expect(user.avatarUrl).toContain('unsplash.com');
  });

  it('should return posts', () => {
    const posts = service.getPosts();
    expect(posts.length).toBe(1);
    expect(posts[0].author.name).toBe('Tom Russo');
    expect(posts[0].content).toContain('Not having fun');
  });
});
