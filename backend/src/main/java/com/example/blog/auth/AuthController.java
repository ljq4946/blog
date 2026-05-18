package com.example.blog.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/login")
  public AuthResponse login(@Valid @RequestBody LoginRequest request) {
    try {
      return authService.login(request);
    } catch (IllegalArgumentException exception) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, exception.getMessage());
    }
  }

  @GetMapping("/me")
  public UserProfile me(Authentication authentication) {
    if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
    }
    return UserProfile.from(user);
  }

  public record LoginRequest(@NotBlank String username, @NotBlank String password) {
  }

  public record AuthResponse(String token, UserProfile user) {
  }

  public record UserProfile(Long id, String username, String role) {
    public static UserProfile from(User user) {
      return new UserProfile(user.getId(), user.getUsername(), user.getRole().name());
    }
  }
}
