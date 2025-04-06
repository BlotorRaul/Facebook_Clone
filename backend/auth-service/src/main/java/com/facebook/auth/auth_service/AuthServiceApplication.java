package com.facebook.auth.auth_service;

import com.facebook.auth.auth_service.dao.UserRepository;
import com.facebook.auth.auth_service.entity.User;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.List;

@SpringBootApplication
public class AuthServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(AuthServiceApplication.class, args);
	}
	/*
	@Bean
	CommandLineRunner commandLineRunner(UserRepository userRepository) {
		return args -> {
			List<User> users = userRepository.findAll();
			users.forEach(user -> {
				System.out.println("User: " + user.getUsername());
				user.getRoles().forEach(role ->
						System.out.println("Role: " + role.getName()));
			});
		};
	}*/



}
