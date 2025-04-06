package com.facebook.comment.comment_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentDTO {
    private Long id;
    private Long postId;
    private Long authorId;
    private String text;
    private Float score;
    private String pictureUrl;
    private LocalDateTime createdAt;
    private String authorUsername; // Pentru a afișa numele autorului
} 