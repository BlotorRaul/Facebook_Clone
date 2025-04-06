package com.facebook.user.user_service.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "bans")
@Data
public class Ban {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "moderator_id", nullable = false)
    private User moderator;

    @Column
    private String reason;

    @Column(name = "banned_at")
    private LocalDateTime bannedAt = LocalDateTime.now();

    @Column(name = "unbanned_at")
    private LocalDateTime unbannedAt;
} 