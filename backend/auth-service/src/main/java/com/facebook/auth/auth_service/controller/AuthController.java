package com.facebook.auth.auth_service.controller;

import com.facebook.auth.auth_service.dto.UserDto;
import com.facebook.auth.auth_service.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController // Returnează JSON
@CrossOrigin(origins = "http://localhost:4200") // Permite comunicarea cu frontend-ul Angular
@RequestMapping("/auth")
public class AuthController {

    private final UserService userService;

    // Injectăm UserService prin constructor
    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials, HttpSession session) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        UserDto userDto = userService.authenticateUser(email, password);
        if (userDto != null) {
            session.setAttribute("user", userDto);
            return ResponseEntity.ok(userDto);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body("Invalid email or password!");
        }
    }

    @GetMapping("/current-user")
    public ResponseEntity<?> getCurrentUser(HttpSession session) {
        UserDto user = userService.getCurrentUser(session.getAttribute("user"));
        if (user != null) {
            return ResponseEntity.ok(user);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No user logged in.");
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        userService.logoutUser(session);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Logout successful.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> registrationData) {
        try {
            String username = registrationData.get("username");
            String email = registrationData.get("email");
            String password = registrationData.get("password");

            // Validare de bază
            if (username == null || email == null || password == null) {
                return ResponseEntity.badRequest().body("Missing required fields");
            }

            UserDto userDto = userService.registerUser(username, email, password);
            return ResponseEntity.ok(userDto);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/register-admin")
    public ResponseEntity<?> registerAdmin(@RequestBody Map<String, String> registrationData) {
        try {
            String username = registrationData.get("username");
            String email = registrationData.get("email");
            String password = registrationData.get("password");

            // Basic validation
            if (username == null || email == null || password == null) {
                return ResponseEntity.badRequest().body("Missing required fields");
            }

            UserDto userDto = userService.registerAdmin(username, email, password);
            return ResponseEntity.ok(userDto);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
