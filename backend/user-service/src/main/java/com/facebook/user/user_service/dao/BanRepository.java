package com.facebook.user.user_service.dao;

import com.facebook.user.user_service.entity.Ban;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface BanRepository extends JpaRepository<Ban, Long> {
    Optional<Ban> findFirstByUserIdOrderByBannedAtDesc(Long userId);
} 