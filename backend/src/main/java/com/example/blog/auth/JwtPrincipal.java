package com.example.blog.auth;

public record JwtPrincipal(String username, UserRole role) {
}
