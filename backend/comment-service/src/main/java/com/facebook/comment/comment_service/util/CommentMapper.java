package com.facebook.comment.comment_service.util;

import com.facebook.comment.comment_service.dto.CommentCreateDTO;
import com.facebook.comment.comment_service.dto.CommentDTO;
import com.facebook.comment.comment_service.entity.Comment;
import org.springframework.stereotype.Component;

@Component
public class CommentMapper {

    public Comment toEntity(CommentCreateDTO commentCreateDTO) {
        Comment comment = new Comment();
        comment.setPostId(commentCreateDTO.getPostId());
        comment.setAuthorId(commentCreateDTO.getAuthorId());
        comment.setText(commentCreateDTO.getText());
        comment.setPictureUrl(commentCreateDTO.getPictureUrl());
        return comment;
    }

    public CommentDTO toDTO(Comment comment) {
        CommentDTO commentDTO = new CommentDTO();
        commentDTO.setId(comment.getId());
        commentDTO.setPostId(comment.getPostId());
        commentDTO.setAuthorId(comment.getAuthorId());
        commentDTO.setText(comment.getText());
        commentDTO.setScore(comment.getScore());
        commentDTO.setPictureUrl(comment.getPictureUrl());
        commentDTO.setCreatedAt(comment.getCreatedAt());

        return commentDTO;
    }
} 