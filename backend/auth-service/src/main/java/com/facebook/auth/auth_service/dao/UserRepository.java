package com.facebook.auth.auth_service.dao;

import com.facebook.auth.auth_service.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    List<User> findByIsBannedTrue();
    
    @Query("SELECT u FROM User u WHERE u.score > :minScore")
    List<User> findUsersWithScoreGreaterThan(Float minScore);
}
