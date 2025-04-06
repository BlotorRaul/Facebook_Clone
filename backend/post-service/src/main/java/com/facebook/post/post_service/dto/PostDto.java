package com.facebook.post.post_service.dto;

import com.facebook.post.post_service.entity.Post;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostDto {
    private Long id;
    private Long authorId;
    private String authorUsername;
    private String title;
    private String text;
    private String pictureUrl;
    private Float score;
    private LocalDateTime createdAt;
    private Post.PostStatus status;
    private Boolean commentsClosed;
    private Set<String> tags = new HashSet<>();
    
    public static PostDto fromEntity(Post post, String authorUsername) {
        PostDto dto = new PostDto();
        dto.setId(post.getId());
        dto.setAuthorId(post.getAuthorId());
        dto.setAuthorUsername(authorUsername);
        dto.setTitle(post.getTitle());
        dto.setText(post.getText());
        dto.setPictureUrl(post.getPictureUrl());
        dto.setScore(post.getScore());
        dto.setCreatedAt(post.getCreatedAt());
        dto.setStatus(post.getStatus());
        dto.setCommentsClosed(post.getCommentsClosed());
        
        if (post.getTags() != null) {
            dto.setTags(post.getTags().stream()
                    .map(tag -> tag.getName())
                    .collect(Collectors.toSet()));
        }
        
        return dto;
    }
} 