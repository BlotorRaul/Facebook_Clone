package com.facebook.auth.auth_service.service;

import com.facebook.auth.auth_service.dto.UserDto;
import com.facebook.auth.auth_service.entity.User;

import java.util.Optional;

public interface UserService {
    Optional<User> findByEmail(String email);
    UserDto authenticateUser(String email, String password);
    UserDto getCurrentUser(Object sessionUser);
    void logoutUser(Object session);
    UserDto registerUser(String username, String email, String password);
    UserDto registerAdmin(String username, String email, String password);
}