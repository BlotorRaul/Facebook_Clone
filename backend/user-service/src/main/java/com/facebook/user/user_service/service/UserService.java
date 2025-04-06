package com.facebook.user.user_service.service;

import com.facebook.user.user_service.dto.UserDTO;
import com.facebook.user.user_service.dto.ScoreUpdateDTO;
import com.facebook.user.user_service.dto.BanDTO;
import com.facebook.user.user_service.entity.User;
import com.facebook.user.user_service.entity.Ban;
import com.facebook.user.user_service.dao.UserRepository;
import com.facebook.user.user_service.dao.BanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityNotFoundException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private BanRepository banRepository;
    
    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));
        return convertToDTO(user);
    }
    
    public Double getUserScore(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));
        return user.getScore();
    }
    
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    @Transactional
    public UserDTO updateUser(Long id, UserDTO userDTO) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));
            
        if (userDTO.getUsername() != null) {
            user.setUsername(userDTO.getUsername());
        }
        
        if (userDTO.getEmail() != null) {
            user.setEmail(userDTO.getEmail());
        }
        
        if (userDTO.getProfileImage() != null) {
            user.setProfileImage(userDTO.getProfileImage());
        }
        
        if (userDTO.getBio() != null) {
            user.setBio(userDTO.getBio());
        }
        
        return convertToDTO(userRepository.save(user));
    }
    
    @Transactional
    public UserDTO updateUserScore(Long id, ScoreUpdateDTO scoreUpdateDTO) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));
        
        if (scoreUpdateDTO.getScore() != null) {
            user.setScore(user.getScore() + scoreUpdateDTO.getScore());
        }
        
        return convertToDTO(userRepository.save(user));
    }
    
    @Transactional
    public UserDTO banUser(Long userId, BanDTO banDTO) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
            
        User moderator = userRepository.findById(banDTO.getModeratorId())
            .orElseThrow(() -> new EntityNotFoundException("Moderator not found with id: " + banDTO.getModeratorId()));
        
        if (user.getIsBanned()) {
            throw new IllegalStateException("User is already banned");
        }
        
        Ban ban = new Ban();
        ban.setUser(user);
        ban.setModerator(moderator);
        ban.setReason(banDTO.getReason());
        banRepository.save(ban);
        
        user.setIsBanned(true);
        return convertToDTO(userRepository.save(user));
    }
    
    @Transactional
    public UserDTO unbanUser(Long userId, Long moderatorId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
            
        if (!user.getIsBanned()) {
            throw new IllegalStateException("User is not banned");
        }
        
        Ban lastBan = banRepository.findFirstByUserIdOrderByBannedAtDesc(userId)
            .orElseThrow(() -> new IllegalStateException("No ban record found for user"));
            
        lastBan.setUnbannedAt(LocalDateTime.now());
        banRepository.save(lastBan);
        
        user.setIsBanned(false);
        return convertToDTO(userRepository.save(user));
    }
    
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new EntityNotFoundException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }
    
    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setProfileImage(user.getProfileImage());
        dto.setBio(user.getBio());
        dto.setScore(user.getScore());
        dto.setIsBanned(user.getIsBanned());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }
} 