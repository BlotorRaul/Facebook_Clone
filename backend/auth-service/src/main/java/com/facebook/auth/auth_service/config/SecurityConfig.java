package com.facebook.auth.auth_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // dezactivează CSRF, util pentru teste cu Postman
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**").permitAll() // permite accesul la endpoint-urile auth
                        .anyRequest().authenticated() // restul endpoint-urilor sunt securizate
                )
                .httpBasic(Customizer.withDefaults()); // opțional, poți dezactiva httpBasic dacă nu-l folosești

        return http.build();
    }
}
/*
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()) // CSRF activat și trimis prin cookie
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/**").permitAll() // Login și înregistrare sunt publice
                .anyRequest().authenticated() // Restul necesită autentificare
            )
            .logout(logout -> logout
                .logoutUrl("/auth/logout")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID") // Șterge sesiunea la logout
            );

        return http.build();
    }
} */
