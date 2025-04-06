package com.facebook.post.post_service.service;

import com.facebook.post.post_service.dao.CommentRepository;
import com.facebook.post.post_service.dao.PostRepository;
import com.facebook.post.post_service.dao.TagRepository;
import com.facebook.post.post_service.dao.UserRepository;
import com.facebook.post.post_service.dto.CommentDto;
import com.facebook.post.post_service.dto.CreatePostRequest;
import com.facebook.post.post_service.dto.PostDetailDto;
import com.facebook.post.post_service.dto.PostDto;
import com.facebook.post.post_service.dto.UpdatePostStatusRequest;
import com.facebook.post.post_service.entity.Post;
import com.facebook.post.post_service.entity.Tag;
import com.facebook.post.post_service.entity.User;
import com.facebook.post.post_service.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PostService {

    private final PostRepository postRepository;
    private final TagRepository tagRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;

    @Autowired
    public PostService(PostRepository postRepository, TagRepository tagRepository, 
                      UserRepository userRepository, CommentRepository commentRepository) {
        this.postRepository = postRepository;
        this.tagRepository = tagRepository;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
    }

    @Transactional
    public PostDto createPost(CreatePostRequest request) {
        User author = userRepository.findById(request.getAuthorId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getAuthorId()));

        Post post = new Post();
        post.setAuthorId(request.getAuthorId());
        post.setTitle(request.getTitle());
        post.setText(request.getText());
        post.setPictureUrl(request.getPictureUrl());

        // Process tags
        if (request.getTags() != null && !request.getTags().isEmpty()) {
            Set<Tag> tags = new HashSet<>();
            for (String tagName : request.getTags()) {
                Tag tag = tagRepository.findByName(tagName)
                        .orElseGet(() -> {
                            Tag newTag = new Tag();
                            newTag.setName(tagName);
                            return tagRepository.save(newTag);
                        });
                tags.add(tag);
            }
            post.setTags(tags);
        }

        Post savedPost = postRepository.save(post);
        return PostDto.fromEntity(savedPost, author.getUsername());
    }

    @Transactional(readOnly = true)
    public List<PostDto> getAllPosts() {
        List<Post> posts = postRepository.findAllByOrderByCreatedAtDesc();
        
        return posts.stream()
                .map(post -> {
                    String username = userRepository.findById(post.getAuthorId())
                            .map(User::getUsername)
                            .orElse("Unknown User");
                    return PostDto.fromEntity(post, username);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PostDetailDto getPostById(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));

        String authorUsername = userRepository.findById(post.getAuthorId())
                .map(User::getUsername)
                .orElse("Unknown User");

        // Get comments for this post
        Set<CommentDto> commentDtos = commentRepository.findByPostIdOrderByCreatedAtDesc(id)
                .stream()
                .map(comment -> {
                    String commentAuthorUsername = userRepository.findById(comment.getAuthorId())
                            .map(User::getUsername)
                            .orElse("Unknown User");
                    return CommentDto.fromEntity(comment, commentAuthorUsername);
                })
                .collect(Collectors.toSet());

        return PostDetailDto.fromEntity(post, authorUsername, commentDtos);
    }

    @Transactional(readOnly = true)
    public List<PostDto> getPostsByTag(String tagName) {
        List<Post> posts = postRepository.findByTagName(tagName);
        
        return posts.stream()
                .map(post -> {
                    String username = userRepository.findById(post.getAuthorId())
                            .map(User::getUsername)
                            .orElse("Unknown User");
                    return PostDto.fromEntity(post, username);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PostDto> searchPostsByTitle(String title) {
        List<Post> posts = postRepository.findByTitleContainingIgnoreCaseOrderByCreatedAtDesc(title);
        
        return posts.stream()
                .map(post -> {
                    String username = userRepository.findById(post.getAuthorId())
                            .map(User::getUsername)
                            .orElse("Unknown User");
                    return PostDto.fromEntity(post, username);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PostDto> getPostsByUser(Long userId) {
        // Verificăm dacă utilizatorul există
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
                
        List<Post> posts = postRepository.findByAuthorIdOrderByCreatedAtDesc(userId);
        
        return posts.stream()
                .map(post -> {
                    String username = userRepository.findById(post.getAuthorId())
                            .map(User::getUsername)
                            .orElse("Unknown User");
                    return PostDto.fromEntity(post, username);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PostDto> getCurrentUserPosts(Long currentUserId) {
        // Verificăm dacă utilizatorul există
        userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found with id: " + currentUserId));
                
        return getPostsByUser(currentUserId);
    }

    @Transactional
    public PostDto updatePostStatus(Long postId, UpdatePostStatusRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));
        
        post.setStatus(request.getStatus());
        
        // Actualizăm și starea comentariilor dacă este furnizată
        if (request.getCommentsClosed() != null) {
            post.setCommentsClosed(request.getCommentsClosed());
        }
        
        Post updatedPost = postRepository.save(post);
        
        String authorUsername = userRepository.findById(updatedPost.getAuthorId())
                .map(User::getUsername)
                .orElse("Unknown User");
        
        return PostDto.fromEntity(updatedPost, authorUsername);
    }

    @Transactional
    public PostDto lockComments(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));
        
        // Setăm statusul la Outdated și blocăm comentariile
        post.setStatus(Post.PostStatus.outdated);
        post.setCommentsClosed(true);
        
        Post updatedPost = postRepository.save(post);
        
        String authorUsername = userRepository.findById(updatedPost.getAuthorId())
                .map(User::getUsername)
                .orElse("Unknown User");
        
        return PostDto.fromEntity(updatedPost, authorUsername);
    }

    @Transactional
    public PostDto markFirstReaction(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));
        
        // Verificăm dacă postarea este în starea "just_posted"
        if (post.getStatus() == Post.PostStatus.just_posted) {
            // Actualizăm statusul la "first_reactions"
            post.setStatus(Post.PostStatus.first_reactions);
            
            Post updatedPost = postRepository.save(post);
            
            String authorUsername = userRepository.findById(updatedPost.getAuthorId())
                    .map(User::getUsername)
                    .orElse("Unknown User");
            
            return PostDto.fromEntity(updatedPost, authorUsername);
        } else {
            // Dacă postarea nu este în starea "just_posted", returnăm postarea fără modificări
            String authorUsername = userRepository.findById(post.getAuthorId())
                    .map(User::getUsername)
                    .orElse("Unknown User");
            
            return PostDto.fromEntity(post, authorUsername);
        }
    }

    @Transactional(readOnly = true)
    public Float getPostScore(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));
        
        return post.getScore();
    }

    @Transactional(readOnly = true)
    public List<PostDto> getTopPosts() {
        List<Post> topPosts = postRepository.findTop10ByOrderByScoreDesc();
        
        return topPosts.stream()
                .map(post -> {
                    String username = userRepository.findById(post.getAuthorId())
                            .map(User::getUsername)
                            .orElse("Unknown User");
                    return PostDto.fromEntity(post, username);
                })
                .collect(Collectors.toList());
    }
} 