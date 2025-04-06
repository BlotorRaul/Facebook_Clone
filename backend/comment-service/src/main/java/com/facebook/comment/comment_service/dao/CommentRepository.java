package com.facebook.comment.comment_service.dao;

import com.facebook.comment.comment_service.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByPostIdOrderByCreatedAtDesc(Long postId);
    
    // Adăugare metodă pentru sortarea după scor
    List<Comment> findByPostIdOrderByScoreDesc(Long postId);
} 