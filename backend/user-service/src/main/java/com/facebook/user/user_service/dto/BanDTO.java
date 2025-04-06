package com.facebook.user.user_service.dto;

import lombok.Data;

@Data
public class BanDTO {
    private Long moderatorId;
    private String reason;
} 