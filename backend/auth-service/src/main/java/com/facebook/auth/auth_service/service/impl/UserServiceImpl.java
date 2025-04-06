package com.facebook.auth.auth_service.service.impl;

import com.facebook.auth.auth_service.dao.RoleRepository;
import com.facebook.auth.auth_service.dao.UserRepository;
import com.facebook.auth.auth_service.dto.UserDto;
import com.facebook.auth.auth_service.entity.Role;
import com.facebook.auth.auth_service.entity.User;
import com.facebook.auth.auth_service.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Optional;
import java.util.stream.Collectors;

import com.facebook.auth.auth_service.exception.UserBannedException;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    // Constructorul cu dependency injection
    public UserServiceImpl(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public UserDto registerUser(String username, String email, String password) {
        // Verificăm dacă email-ul sau username-ul există deja
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        if (userRepository.findByUsername(username).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        // Creăm noul utilizator
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setScore(0f);
        user.setIsBanned(false);
        user.setRoles(new HashSet<>());

        // Adăugăm rolul DEFAULT de USER
        Role userRole = roleRepository.findByName(Role.RoleName.USER)
                .orElseThrow(() -> new RuntimeException("Default role not found"));
        user.addRole(userRole);

        // Salvăm utilizatorul
        user = userRepository.save(user);

        // Returnăm DTO-ul
        return new UserDto(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getScore(),
            user.getIsBanned(),
            user.getCreatedAt(),
            user.getUpdatedAt(),
            user.getRoles().stream()
                .map(role -> role.getName().toString())
                .collect(Collectors.toSet())
        );
    }

    @Override
    @Transactional
    public UserDto registerAdmin(String username, String email, String password) {
        // Check if email or username already exists
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        if (userRepository.findByUsername(username).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        // Create new user
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setScore(0f);
        user.setIsBanned(false);
        user.setRoles(new HashSet<>());

        // Add both USER and ADMIN roles
        Role userRole = roleRepository.findByName(Role.RoleName.USER)
                .orElseThrow(() -> new RuntimeException("User role not found"));
        Role adminRole = roleRepository.findByName(Role.RoleName.ADMIN)
                .orElseThrow(() -> new RuntimeException("Admin role not found"));
        
        user.addRole(userRole);
        user.addRole(adminRole);

        // Save the user
        user = userRepository.save(user);

        // Return DTO
        return new UserDto(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getScore(),
            user.getIsBanned(),
            user.getCreatedAt(),
            user.getUpdatedAt(),
            user.getRoles().stream()
                .map(role -> role.getName().toString())
                .collect(Collectors.toSet())
        );
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public UserDto authenticateUser(String email, String password) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            
            // Verificăm parola folosind passwordEncoder.matches()
            if (passwordEncoder.matches(password, user.getPassword())) {
                // Verificăm dacă utilizatorul este banat
                if (user.getIsBanned()) {
                    return null;
                }

                return new UserDto(
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getScore(),
                    user.getIsBanned(),
                    user.getCreatedAt(),
                    user.getUpdatedAt(),
                    user.getRoles().stream()
                        .map(role -> role.getName().toString())
                        .collect(Collectors.toSet())
                );
            }
        }
        return null;
    }

    @Override
    public UserDto getCurrentUser(Object sessionUser) {
        return sessionUser instanceof UserDto ? (UserDto) sessionUser : null;
    }

    @Override
    public void logoutUser(Object session) {
        if (session instanceof HttpSession) {
            ((HttpSession) session).invalidate();
        }
    }
}
