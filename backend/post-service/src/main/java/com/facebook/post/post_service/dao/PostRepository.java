package com.facebook.post.post_service.dao;

import com.facebook.post.post_service.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findAllByOrderByCreatedAtDesc();
    
    // Filtrare după tag
    @Query("SELECT p FROM Post p JOIN p.tags t WHERE t.name = :tagName ORDER BY p.createdAt DESC")
    List<Post> findByTagName(@Param("tagName") String tagName);
    
    // Filtrare după titlu (conține)
    List<Post> findByTitleContainingIgnoreCaseOrderByCreatedAtDesc(String title);
    
    // Filtrare după autor
    List<Post> findByAuthorIdOrderByCreatedAtDesc(Long authorId);
    
    // Obține postările ordonate după scor (descrescător)
    List<Post> findTop10ByOrderByScoreDesc();
} 