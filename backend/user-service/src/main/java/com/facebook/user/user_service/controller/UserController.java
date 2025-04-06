package com.facebook.user.user_service.controller;

import com.facebook.user.user_service.dto.UserDTO;
import com.facebook.user.user_service.dto.ScoreUpdateDTO;
import com.facebook.user.user_service.dto.BanDTO;
import com.facebook.user.user_service.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "*")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }
    
    @GetMapping("/{id}/score")
    public ResponseEntity<Double> getUserScore(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserScore(id));
    }
    
    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id, @RequestBody UserDTO userDTO) {
        return ResponseEntity.ok(userService.updateUser(id, userDTO));
    }
    
    @PutMapping("/{id}/score")
    public ResponseEntity<UserDTO> updateUserScore(@PathVariable Long id, @RequestBody ScoreUpdateDTO scoreUpdateDTO) {
        return ResponseEntity.ok(userService.updateUserScore(id, scoreUpdateDTO));
    }
    
    @PutMapping("/{id}/ban")
    public ResponseEntity<UserDTO> banUser(@PathVariable Long id, @RequestBody BanDTO banDTO) {
        return ResponseEntity.ok(userService.banUser(id, banDTO));
    }
    
    @PutMapping("/{id}/unban")
    public ResponseEntity<UserDTO> unbanUser(@PathVariable Long id, @RequestParam Long moderatorId) {
        return ResponseEntity.ok(userService.unbanUser(id, moderatorId));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok().build();
    }
} 