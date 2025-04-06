package com.facebook.post.post_service.service;

import com.facebook.post.post_service.dao.TagRepository;
import com.facebook.post.post_service.dto.CreateTagRequest;
import com.facebook.post.post_service.dto.TagDto;
import com.facebook.post.post_service.entity.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TagService {

    private final TagRepository tagRepository;

    @Autowired
    public TagService(TagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    @Transactional
    public TagDto createTag(CreateTagRequest request) {
        // Verificăm dacă tag-ul există deja
        Optional<Tag> existingTag = tagRepository.findByName(request.getName());
        
        if (existingTag.isPresent()) {
            // Returnăm tag-ul existent
            return TagDto.fromEntity(existingTag.get());
        }
        
        // Creăm un tag nou
        Tag tag = new Tag();
        tag.setName(request.getName());
        
        Tag savedTag = tagRepository.save(tag);
        return TagDto.fromEntity(savedTag);
    }

    @Transactional(readOnly = true)
    public List<TagDto> getAllTags() {
        List<Tag> tags = tagRepository.findAll();
        
        return tags.stream()
                .map(TagDto::fromEntity)
                .collect(Collectors.toList());
    }
} 