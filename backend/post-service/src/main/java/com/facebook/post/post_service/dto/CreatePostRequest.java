package com.facebook.post.post_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreatePostRequest {
    @NotNull(message = "Author ID is required")
    private Long authorId;
    
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "Text is required")
    private String text;
    
    private String pictureUrl;
    
    private Set<String> tags;
} 