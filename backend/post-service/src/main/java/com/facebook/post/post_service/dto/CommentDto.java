package com.facebook.post.post_service.dto;

import com.facebook.post.post_service.entity.Comment;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentDto {
    private Long id;
    private Long postId;
    private Long authorId;
    private String authorUsername;
    private String text;
    private Float score;
    private String pictureUrl;
    private LocalDateTime createdAt;
    
    public static CommentDto fromEntity(Comment comment, String authorUsername) {
        CommentDto dto = new CommentDto();
        dto.setId(comment.getId());
        dto.setPostId(comment.getPost().getId());
        dto.setAuthorId(comment.getAuthorId());
        dto.setAuthorUsername(authorUsername);
        dto.setText(comment.getText());
        dto.setScore(comment.getScore());
        dto.setPictureUrl(comment.getPictureUrl());
        dto.setCreatedAt(comment.getCreatedAt());
        return dto;
    }
} 