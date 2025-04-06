package com.facebook.comment.comment_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentCreateDTO {
    @NotNull(message = "Post ID este obligatoriu")
    private Long postId;
    
    @NotNull(message = "Author ID este obligatoriu")
    private Long authorId;
    
    @NotBlank(message = "Textul comentariului este obligatoriu")
    private String text;
    
    private String pictureUrl;
} 