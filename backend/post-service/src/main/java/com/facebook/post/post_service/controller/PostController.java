package com.facebook.post.post_service.controller;

import com.facebook.post.post_service.dto.CreatePostRequest;
import com.facebook.post.post_service.dto.PostDetailDto;
import com.facebook.post.post_service.dto.PostDto;
import com.facebook.post.post_service.dto.UpdatePostStatusRequest;
import com.facebook.post.post_service.dto.PostScoreDto;
import com.facebook.post.post_service.service.PostService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/posts")
public class PostController {

    private final PostService postService;

    @Autowired
    public PostController(PostService postService) {
        this.postService = postService;
    }

    @PostMapping
    public ResponseEntity<PostDto> createPost(@Valid @RequestBody CreatePostRequest request) {
        PostDto createdPost = postService.createPost(request);
        return new ResponseEntity<>(createdPost, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<PostDto>> getAllPosts() {
        List<PostDto> posts = postService.getAllPosts();
        return ResponseEntity.ok(posts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostDetailDto> getPostById(@PathVariable Long id) {
        PostDetailDto post = postService.getPostById(id);
        return ResponseEntity.ok(post);
    }

    @GetMapping("/filter")
    public ResponseEntity<List<PostDto>> getPostsByTag(@RequestParam String tag) {
        List<PostDto> posts = postService.getPostsByTag(tag);
        return ResponseEntity.ok(posts);
    }

    @GetMapping("/search")
    public ResponseEntity<List<PostDto>> searchPostsByTitle(@RequestParam String title) {
        List<PostDto> posts = postService.searchPostsByTitle(title);
        return ResponseEntity.ok(posts);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PostDto>> getPostsByUser(@PathVariable Long userId) {
        List<PostDto> posts = postService.getPostsByUser(userId);
        return ResponseEntity.ok(posts);
    }

    @GetMapping("/me")
    public ResponseEntity<List<PostDto>> getCurrentUserPosts(@RequestHeader("X-User-Id") Long currentUserId) {
        // În mod normal, ID-ul utilizatorului curent ar fi extras din token-ul de autentificare
        // Aici folosim un header pentru simplitate
        List<PostDto> posts = postService.getCurrentUserPosts(currentUserId);
        return ResponseEntity.ok(posts);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<PostDto> updatePostStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePostStatusRequest request) {
        PostDto updatedPost = postService.updatePostStatus(id, request);
        return ResponseEntity.ok(updatedPost);
    }

    @PatchMapping("/{id}/lock-comments")
    public ResponseEntity<PostDto> lockComments(@PathVariable Long id) {
        PostDto updatedPost = postService.lockComments(id);
        return ResponseEntity.ok(updatedPost);
    }

    @PatchMapping("/{id}/first-comment")
    public ResponseEntity<PostDto> markFirstReaction(@PathVariable Long id) {
        PostDto updatedPost = postService.markFirstReaction(id);
        return ResponseEntity.ok(updatedPost);
    }

    @GetMapping("/{id}/score")
    public ResponseEntity<PostScoreDto> getPostScore(@PathVariable Long id) {
        Float score = postService.getPostScore(id);
        PostScoreDto scoreDto = new PostScoreDto(id, score);
        return ResponseEntity.ok(scoreDto);
    }

    @GetMapping("/top")
    public ResponseEntity<List<PostDto>> getTopPosts() {
        List<PostDto> topPosts = postService.getTopPosts();
        return ResponseEntity.ok(topPosts);
    }
} 