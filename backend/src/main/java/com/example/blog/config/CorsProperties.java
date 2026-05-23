package com.example.blog.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@ConfigurationProperties(prefix = "app.cors")
public class CorsProperties {

  private List<String> allowedOrigins = new ArrayList<>(List.of("*"));

  public List<String> getAllowedOrigins() {
    return allowedOrigins;
  }

  public void setAllowedOrigins(List<String> allowedOrigins) {
    this.allowedOrigins = allowedOrigins == null || allowedOrigins.isEmpty()
        ? new ArrayList<>(List.of("*"))
        : new ArrayList<>(allowedOrigins);
  }
}
