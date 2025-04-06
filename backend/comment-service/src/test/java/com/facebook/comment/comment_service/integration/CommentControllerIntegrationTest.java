package com.facebook.comment.comment_service.integration;

import com.facebook.comment.comment_service.dto.CommentCreateDTO;
import com.facebook.comment.comment_service.dto.CommentDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class CommentControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Test de integrare pentru crearea unui comentariu")
    void testCreateComment() throws Exception {
        CommentCreateDTO commentCreateDTO = new CommentCreateDTO();
        commentCreateDTO.setPostId(1L);
        commentCreateDTO.setAuthorId(2L);
        commentCreateDTO.setText("Test comment");
        commentCreateDTO.setPictureUrl("http://example.com/image.jpg");

        mockMvc.perform(post("/comments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(commentCreateDTO)))
                .andExpect(status().isCreated());
    }
} 