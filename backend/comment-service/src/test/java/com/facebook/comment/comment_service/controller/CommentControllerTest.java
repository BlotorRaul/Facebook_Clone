package com.facebook.comment.comment_service.controller;

import com.facebook.comment.comment_service.dto.CommentCreateDTO;
import com.facebook.comment.comment_service.dto.CommentDTO;
import com.facebook.comment.comment_service.dto.CommentUpdateDTO;
import com.facebook.comment.comment_service.exception.ResourceNotFoundException;
import com.facebook.comment.comment_service.service.CommentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
public class CommentControllerTest {

    private MockMvc mockMvc;

    @Mock
    private CommentService commentService;

    @InjectMocks
    private CommentController commentController;

    private ObjectMapper objectMapper = new ObjectMapper();

    private CommentDTO commentDTO;
    private CommentCreateDTO commentCreateDTO;
    private CommentUpdateDTO commentUpdateDTO;

    @BeforeEach
    void setUp() {
        // Configurare MockMvc
        mockMvc = MockMvcBuilders
                .standaloneSetup(commentController)
                .build();
        
        // Configurare ObjectMapper pentru serializare/deserializare date
        objectMapper.findAndRegisterModules(); // Pentru a gestiona LocalDateTime
        
        // Inițializare commentDTO
        commentDTO = new CommentDTO();
        commentDTO.setId(1L);
        commentDTO.setPostId(1L);
        commentDTO.setAuthorId(2L);
        commentDTO.setText("Test comment");
        commentDTO.setScore(5.0f);
        commentDTO.setPictureUrl("http://example.com/image.jpg");
        commentDTO.setCreatedAt(LocalDateTime.now());
        commentDTO.setAuthorUsername("testUser");

        // Inițializare commentCreateDTO
        commentCreateDTO = new CommentCreateDTO();
        commentCreateDTO.setPostId(1L);
        commentCreateDTO.setAuthorId(2L);
        commentCreateDTO.setText("Test comment");
        commentCreateDTO.setPictureUrl("http://example.com/image.jpg");

        // Inițializare commentUpdateDTO
        commentUpdateDTO = new CommentUpdateDTO();
        commentUpdateDTO.setText("Updated comment");
        commentUpdateDTO.setPictureUrl("http://example.com/updated-image.jpg");
    }

    @Test
    @DisplayName("Test pentru crearea unui comentariu")
    void testCreateComment() throws Exception {
        when(commentService.createComment(any(CommentCreateDTO.class))).thenReturn(commentDTO);

        mockMvc.perform(post("/comments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(commentCreateDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.text", is("Test comment")));

        verify(commentService, times(1)).createComment(any(CommentCreateDTO.class));
    }

    @Test
    @DisplayName("Test pentru obținerea comentariilor după ID-ul postării")
    void testGetCommentsByPostId() throws Exception {
        List<CommentDTO> comments = Arrays.asList(commentDTO);
        when(commentService.getCommentsByPostId(anyLong())).thenReturn(comments);

        mockMvc.perform(get("/comments/post/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(1)))
                .andExpect(jsonPath("$[0].text", is("Test comment")));

        verify(commentService, times(1)).getCommentsByPostId(anyLong());
    }

    @Test
    @DisplayName("Test pentru obținerea comentariilor sortate după scor")
    void testGetCommentsByPostIdSortedByScore() throws Exception {
        List<CommentDTO> comments = Arrays.asList(commentDTO);
        when(commentService.getCommentsByPostIdSortedByScore(anyLong())).thenReturn(comments);

        mockMvc.perform(get("/comments/post/1/sorted"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(1)))
                .andExpect(jsonPath("$[0].text", is("Test comment")));

        verify(commentService, times(1)).getCommentsByPostIdSortedByScore(anyLong());
    }

    @Test
    @DisplayName("Test pentru obținerea unui comentariu după ID")
    void testGetCommentById() throws Exception {
        when(commentService.getCommentById(anyLong())).thenReturn(commentDTO);

        mockMvc.perform(get("/comments/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.text", is("Test comment")));

        verify(commentService, times(1)).getCommentById(anyLong());
    }

    @Test
    @DisplayName("Test pentru obținerea unui comentariu după ID inexistent")
    void testGetCommentByIdNotFound() throws Exception {
        when(commentService.getCommentById(anyLong())).thenThrow(new ResourceNotFoundException("Comentariul nu a fost găsit"));

        mockMvc.perform(get("/comments/999"))
                .andExpect(status().isNotFound());

        verify(commentService, times(1)).getCommentById(anyLong());
    }

    @Test
    @DisplayName("Test pentru actualizarea unui comentariu")
    void testUpdateComment() throws Exception {
        CommentDTO updatedCommentDTO = new CommentDTO();
        updatedCommentDTO.setId(1L);
        updatedCommentDTO.setPostId(1L);
        updatedCommentDTO.setAuthorId(2L);
        updatedCommentDTO.setText("Updated comment");
        updatedCommentDTO.setScore(5.0f);
        updatedCommentDTO.setPictureUrl("http://example.com/updated-image.jpg");
        updatedCommentDTO.setCreatedAt(commentDTO.getCreatedAt());
        updatedCommentDTO.setAuthorUsername("testUser");

        when(commentService.updateComment(anyLong(), any(CommentUpdateDTO.class))).thenReturn(updatedCommentDTO);

        mockMvc.perform(put("/comments/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(commentUpdateDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.text", is("Updated comment")))
                .andExpect(jsonPath("$.pictureUrl", is("http://example.com/updated-image.jpg")));

        verify(commentService, times(1)).updateComment(anyLong(), any(CommentUpdateDTO.class));
    }

    @Test
    @DisplayName("Test pentru ștergerea unui comentariu")
    void testDeleteComment() throws Exception {
        doNothing().when(commentService).deleteComment(anyLong());

        mockMvc.perform(delete("/comments/1"))
                .andExpect(status().isNoContent());

        verify(commentService, times(1)).deleteComment(anyLong());
    }
} 