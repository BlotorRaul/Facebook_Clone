package com.gateway.api_gateway.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    private final List<Map<String, Object>> users = new ArrayList<>();
    private Map<String, Object> currentUser = null;

    public AuthController() {
        // Initialize demo users
        Map<String, Object> user1 = new HashMap<>();
        user1.put("id", "1");
        user1.put("name", "John Doe");
        user1.put("email", "blotor.raul@yahoo.com");
        user1.put("password", "password123");
        user1.put("avatarUrl", "https://i.pravatar.cc/150?img=1");
        user1.put("role", "user");
        user1.put("isBanned", false);
        user1.put("phone", "+40753420201");
        user1.put("score", 0);

        Map<String, Object> user2 = new HashMap<>();
        user2.put("id", "2");
        user2.put("name", "Jane Smith");
        user2.put("email", "jane@example.com");
        user2.put("password", "password123");
        user2.put("avatarUrl", "https://i.pravatar.cc/150?img=2");
        user2.put("role", "user");
        user2.put("isBanned", false);
        user2.put("phone", "+407xxxxxxxx");
        user2.put("score", 0);

        Map<String, Object> admin = new HashMap<>();
        admin.put("id", "4");
        admin.put("name", "Admin User");
        admin.put("email", "admin@example.com");
        admin.put("password", "admin123");
        admin.put("avatarUrl", "https://i.pravatar.cc/150?img=4");
        admin.put("role", "admin");
        admin.put("isBanned", false);
        admin.put("phone", "");
        admin.put("score", 0);

        users.add(user1);
        users.add(user2);
        users.add(admin);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        System.out.println("Login attempt for: " + credentials.get("email"));
        
        String email = credentials.get("email");
        String password = credentials.get("password");

        Optional<Map<String, Object>> user = users.stream()
                .filter(u -> u.get("email").equals(email) && u.get("password").equals(password))
                .findFirst();

        if (user.isPresent()) {
            Map<String, Object> foundUser = user.get();
            if ((Boolean) foundUser.get("isBanned")) {
                return ResponseEntity.badRequest().body("Account is banned");
            }
            currentUser = new HashMap<>(foundUser);
            currentUser.remove("password");
            System.out.println("User logged in: " + foundUser.get("name"));
            return ResponseEntity.ok(currentUser);
        }

        return ResponseEntity.badRequest().body("Invalid credentials");
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, Object> userData) {
        System.out.println("Register attempt for: " + userData.get("email"));
        
        String email = (String) userData.get("email");
        if (users.stream().anyMatch(u -> u.get("email").equals(email))) {
            return ResponseEntity.badRequest().body("Email already exists");
        }

        Map<String, Object> newUser = new HashMap<>(userData);
        newUser.put("id", String.valueOf(users.size() + 1));
        newUser.put("isBanned", false);
        newUser.put("score", 0);
        users.add(newUser);

        System.out.println("New user registered: " + newUser.get("name"));
        return ResponseEntity.ok(newUser);
    }

    @GetMapping("/current-user")
    public ResponseEntity<?> getCurrentUser() {
        if (currentUser != null) {
            return ResponseEntity.ok(currentUser);
        }
        return ResponseEntity.ok(null);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        System.out.println("User logged out: " + (currentUser != null ? currentUser.get("name") : "none"));
        currentUser = null;
        return ResponseEntity.ok().build();
    }

    @PutMapping("/update-profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, Object> updates) {
        if (currentUser == null) {
            return ResponseEntity.badRequest().body("No user logged in");
        }

        String userId = (String) currentUser.get("id");
        Optional<Map<String, Object>> userOpt = users.stream()
                .filter(u -> u.get("id").equals(userId))
                .findFirst();

        if (userOpt.isPresent()) {
            Map<String, Object> user = userOpt.get();
            updates.forEach((key, value) -> {
                if (!key.equals("id") && !key.equals("role") && !key.equals("isBanned")) {
                    user.put(key, value);
                }
            });
            currentUser = new HashMap<>(user);
            currentUser.remove("password");
            System.out.println("Profile updated for user: " + user.get("name"));
            return ResponseEntity.ok(currentUser);
        }

        return ResponseEntity.badRequest().body("User not found");
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        List<Map<String, Object>> safeUsers = users.stream()
                .map(user -> {
                    Map<String, Object> safeUser = new HashMap<>(user);
                    safeUser.remove("password");
                    return safeUser;
                })
                .toList();
        return ResponseEntity.ok(safeUsers);
    }

    @PostMapping("/ban/{userId}")
    public ResponseEntity<?> banUser(@PathVariable String userId) {
        Optional<Map<String, Object>> userOpt = users.stream()
                .filter(u -> u.get("id").equals(userId))
                .findFirst();

        if (userOpt.isPresent()) {
            Map<String, Object> user = userOpt.get();
            if ("admin".equals(user.get("role"))) {
                return ResponseEntity.badRequest().body("Cannot ban admin users");
            }
            user.put("isBanned", true);
            System.out.println("User banned: " + user.get("name"));
            return ResponseEntity.ok().build();
        }

        return ResponseEntity.badRequest().body("User not found");
    }

    @PostMapping("/unban/{userId}")
    public ResponseEntity<?> unbanUser(@PathVariable String userId) {
        Optional<Map<String, Object>> userOpt = users.stream()
                .filter(u -> u.get("id").equals(userId))
                .findFirst();

        if (userOpt.isPresent()) {
            Map<String, Object> user = userOpt.get();
            user.put("isBanned", false);
            System.out.println("User unbanned: " + user.get("name"));
            return ResponseEntity.ok().build();
        }

        return ResponseEntity.badRequest().body("User not found");
    }

    @PutMapping("/score/{userId}")
    public ResponseEntity<?> updateScore(@PathVariable String userId, @RequestBody Map<String, Boolean> vote) {
        Optional<Map<String, Object>> userOpt = users.stream()
                .filter(u -> u.get("id").equals(userId))
                .findFirst();

        if (userOpt.isPresent()) {
            Map<String, Object> user = userOpt.get();
            int currentScore = (int) user.get("score");
            boolean isUpvote = vote.get("isUpvote");
            user.put("score", currentScore + (isUpvote ? 1 : -1));
            System.out.println("Score updated for user: " + user.get("name") + " - New score: " + user.get("score"));
            return ResponseEntity.ok().build();
        }

        return ResponseEntity.badRequest().body("User not found");
    }
} 