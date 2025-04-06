package com.facebook.comment.comment_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentUpdateDTO {
    @NotBlank(message = "Textul comentariului este obligatoriu")
    private String text;
    
    private String pictureUrl;
} 