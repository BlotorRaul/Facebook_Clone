package com.facebook.user.user_service.dto;

import lombok.Data;

@Data
public class ScoreUpdateDTO {
    private Double score;
    private String reason;
    private String updatedBy;
} 