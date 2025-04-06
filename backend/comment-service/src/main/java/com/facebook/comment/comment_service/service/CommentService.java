package com.facebook.comment.comment_service.service;

import com.facebook.comment.comment_service.dto.CommentCreateDTO;
import com.facebook.comment.comment_service.dto.CommentDTO;
import com.facebook.comment.comment_service.dto.CommentUpdateDTO;
import com.facebook.comment.comment_service.entity.Comment;

import java.util.List;

public interface CommentService {
    CommentDTO createComment(CommentCreateDTO commentCreateDTO);
    List<CommentDTO> getCommentsByPostId(Long postId);
    CommentDTO getCommentById(Long commentId);
    CommentDTO updateComment(Long commentId, CommentUpdateDTO commentUpdateDTO);
    void deleteComment(Long commentId);
    
    // Adăugare metodă pentru comentarii sortate după scor
    List<CommentDTO> getCommentsByPostIdSortedByScore(Long postId);
} 