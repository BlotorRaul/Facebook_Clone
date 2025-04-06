package com.facebook.comment.comment_service.service.impl;

import com.facebook.comment.comment_service.dao.CommentRepository;
import com.facebook.comment.comment_service.dto.CommentCreateDTO;
import com.facebook.comment.comment_service.dto.CommentDTO;
import com.facebook.comment.comment_service.dto.CommentUpdateDTO;
import com.facebook.comment.comment_service.entity.Comment;
import com.facebook.comment.comment_service.exception.ResourceNotFoundException;
import com.facebook.comment.comment_service.service.CommentService;
import com.facebook.comment.comment_service.util.CommentMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final CommentMapper commentMapper;

    @Autowired
    public CommentServiceImpl(CommentRepository commentRepository, CommentMapper commentMapper) {
        this.commentRepository = commentRepository;
        this.commentMapper = commentMapper;
    }

    @Override
    public CommentDTO createComment(CommentCreateDTO commentCreateDTO) {
        Comment comment = commentMapper.toEntity(commentCreateDTO);
        Comment savedComment = commentRepository.save(comment);
        return commentMapper.toDTO(savedComment);
    }

    @Override
    public List<CommentDTO> getCommentsByPostId(Long postId) {
        List<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtDesc(postId);
        return comments.stream()
                .map(commentMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public CommentDTO getCommentById(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comentariul cu ID-ul " + commentId + " nu a fost găsit"));
        return commentMapper.toDTO(comment);
    }

    @Override
    public CommentDTO updateComment(Long commentId, CommentUpdateDTO commentUpdateDTO) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comentariul cu ID-ul " + commentId + " nu a fost găsit"));
        
        comment.setText(commentUpdateDTO.getText());
        if (commentUpdateDTO.getPictureUrl() != null) {
            comment.setPictureUrl(commentUpdateDTO.getPictureUrl());
        }
        
        Comment updatedComment = commentRepository.save(comment);
        return commentMapper.toDTO(updatedComment);
    }

    @Override
    public void deleteComment(Long commentId) {
        if (!commentRepository.existsById(commentId)) {
            throw new ResourceNotFoundException("Comentariul cu ID-ul " + commentId + " nu a fost găsit");
        }
        commentRepository.deleteById(commentId);
    }
    
    @Override
    public List<CommentDTO> getCommentsByPostIdSortedByScore(Long postId) {
        List<Comment> comments = commentRepository.findByPostIdOrderByScoreDesc(postId);
        return comments.stream()
                .map(commentMapper::toDTO)
                .collect(Collectors.toList());
    }
} 