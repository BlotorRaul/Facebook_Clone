package com.facebook.post.post_service.dto;

import com.facebook.post.post_service.entity.Post;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePostStatusRequest {
    @NotNull(message = "Status is required")
    private Post.PostStatus status;
    
    private Boolean commentsClosed;
} 