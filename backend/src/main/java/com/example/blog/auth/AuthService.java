package com.example.blog.auth;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

  private final UserRepository users;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  public AuthService(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService) {
    this.users = users;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
  }

  public AuthController.AuthResponse login(AuthController.LoginRequest request) {
    User user = users.findByUsername(request.username())
        .filter(candidate -> passwordEncoder.matches(request.password(), candidate.getPasswordHash()))
        .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));
    return new AuthController.AuthResponse(jwtService.create(user), AuthController.UserProfile.from(user));
  }
}
