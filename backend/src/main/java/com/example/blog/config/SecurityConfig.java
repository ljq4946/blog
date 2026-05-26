package com.example.blog.config;

import com.example.blog.auth.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

  private final CorsProperties corsProperties;

  public SecurityConfig(CorsProperties corsProperties) {
    this.corsProperties = corsProperties;
  }

  @Bean
  SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter)
      throws Exception {
    http
        .csrf(AbstractHttpConfigurer::disable)
        .cors(Customizer.withDefaults())
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .exceptionHandling(exceptions -> exceptions
            .authenticationEntryPoint((request, response, exception) -> response.sendError(HttpStatus.UNAUTHORIZED.value()))
            .accessDeniedHandler((request, response, exception) -> {
              Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
              boolean anonymous = authentication == null || authentication instanceof AnonymousAuthenticationToken;
              response.sendError(anonymous ? HttpStatus.UNAUTHORIZED.value() : HttpStatus.FORBIDDEN.value());
            }))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/v1/auth/login", "/uploads/**").permitAll()
            .requestMatchers(HttpMethod.GET,
                "/api/v1/posts/**",
                "/api/v1/categories",
                "/api/v1/tags",
                "/api/v1/archive",
                "/api/v1/site-pages/about",
                "/api/v1/home-profile").permitAll()
            .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
            .requestMatchers("/api/v1/auth/me").authenticated()
            .anyRequest().permitAll())
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    List<String> allowedOrigins = corsProperties.getAllowedOrigins();
    if (allowedOrigins.contains("*")) {
      configuration.setAllowedOriginPatterns(List.of("*"));
    } else {
      configuration.setAllowedOrigins(allowedOrigins);
    }
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(List.of("*"));
    configuration.setAllowCredentials(false);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }
}
