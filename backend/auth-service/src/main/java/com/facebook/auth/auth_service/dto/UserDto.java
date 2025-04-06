package com.facebook.auth.auth_service.dto;

import java.sql.Timestamp;
import java.util.Set;

public class UserDto {
    private Long id;
    private String username;
    private String email;
    private Float score;
    private Boolean isBanned;
    private Timestamp createdAt;
    private Timestamp updatedAt;
    private Set<String> roles;

    // Constructor implicit
    public UserDto() {}

    // Constructor cu parametri
    public UserDto(Long id, String username, String email, Float score, 
                  Boolean isBanned, Timestamp createdAt, Timestamp updatedAt, 
                  Set<String> roles) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.score = score;
        this.isBanned = isBanned;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.roles = roles;
    }

    // Getteri și setteri pentru toate câmpurile
    public Float getScore() {
        return score;
    }

    public void setScore(Float score) {
        this.score = score;
    }

    public Boolean getIsBanned() {
        return isBanned;
    }

    public void setIsBanned(Boolean isBanned) {
        this.isBanned = isBanned;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    public Timestamp getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Timestamp updatedAt) {
        this.updatedAt = updatedAt;
    }

    // Getteri și Setteri
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public void setRoles(Set<String> roles) {
        this.roles = roles;
    }

    // toString pentru debugging
    @Override
    public String toString() {
        return "UserDto{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", score=" + score +
                ", isBanned=" + isBanned +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                ", roles=" + roles +
                '}';
    }
}
