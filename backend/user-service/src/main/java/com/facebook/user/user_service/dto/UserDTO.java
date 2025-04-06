package com.facebook.user.user_service.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private String profileImage;
    private String bio;
    private Double score;
    private Boolean isBanned;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 