package com.facebook.comment.comment_service.controller;

import com.facebook.comment.comment_service.dto.CommentCreateDTO;
import com.facebook.comment.comment_service.dto.CommentDTO;
import com.facebook.comment.comment_service.dto.CommentUpdateDTO;
import com.facebook.comment.comment_service.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/comments")
@Tag(name = "Comentarii", description = "API pentru gestionarea comentariilor")
public class CommentController {

    private final CommentService commentService;

    @Autowired
    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping
    @Operation(summary = "Adaugă un comentariu nou", description = "Creează un comentariu nou pentru o postare")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Comentariu creat cu succes"),
            @ApiResponse(responseCode = "400", description = "Date invalide furnizate")
    })
    public ResponseEntity<CommentDTO> createComment(
            @Valid @RequestBody CommentCreateDTO commentCreateDTO) {
        CommentDTO createdComment = commentService.createComment(commentCreateDTO);
        return new ResponseEntity<>(createdComment, HttpStatus.CREATED);
    }

    @GetMapping("/post/{postId}")
    @Operation(summary = "Obține toate comentariile pentru o postare", description = "Returnează toate comentariile pentru o postare specificată, ordonate după data creării")
    public ResponseEntity<List<CommentDTO>> getCommentsByPostId(
            @Parameter(description = "ID-ul postării") @PathVariable Long postId) {
        List<CommentDTO> comments = commentService.getCommentsByPostId(postId);
        return ResponseEntity.ok(comments);
    }

    @GetMapping("/post/{postId}/sorted")
    @Operation(summary = "Obține comentariile sortate după scor", description = "Returnează toate comentariile pentru o postare specificată, sortate după scor în ordine descrescătoare")
    public ResponseEntity<List<CommentDTO>> getCommentsByPostIdSortedByScore(
            @Parameter(description = "ID-ul postării") @PathVariable Long postId) {
        List<CommentDTO> comments = commentService.getCommentsByPostIdSortedByScore(postId);
        return ResponseEntity.ok(comments);
    }

    @GetMapping("/{commentId}")
    @Operation(summary = "Obține un comentariu după ID", description = "Returnează un comentariu specific după ID-ul său")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Comentariu găsit"),
            @ApiResponse(responseCode = "404", description = "Comentariu negăsit")
    })
    public ResponseEntity<CommentDTO> getCommentById(
            @Parameter(description = "ID-ul comentariului") @PathVariable Long commentId) {
        CommentDTO comment = commentService.getCommentById(commentId);
        return ResponseEntity.ok(comment);
    }

    @PutMapping("/{commentId}")
    @Operation(summary = "Actualizează un comentariu", description = "Actualizează textul și/sau URL-ul imaginii unui comentariu existent")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Comentariu actualizat cu succes"),
            @ApiResponse(responseCode = "400", description = "Date invalide furnizate"),
            @ApiResponse(responseCode = "404", description = "Comentariu negăsit")
    })
    public ResponseEntity<CommentDTO> updateComment(
            @Parameter(description = "ID-ul comentariului") @PathVariable Long commentId,
            @Valid @RequestBody CommentUpdateDTO commentUpdateDTO) {
        CommentDTO updatedComment = commentService.updateComment(commentId, commentUpdateDTO);
        return ResponseEntity.ok(updatedComment);
    }

    @DeleteMapping("/{commentId}")
    @Operation(summary = "Șterge un comentariu", description = "Șterge un comentariu existent după ID-ul său")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Comentariu șters cu succes"),
            @ApiResponse(responseCode = "404", description = "Comentariu negăsit")
    })
    public ResponseEntity<Void> deleteComment(
            @Parameter(description = "ID-ul comentariului") @PathVariable Long commentId) {
        commentService.deleteComment(commentId);
        return ResponseEntity.noContent().build();
    }
} 