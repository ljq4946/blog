package com.example.blog.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class UploadResourceConfig implements WebMvcConfigurer {

  private final UploadProperties uploadProperties;

  public UploadResourceConfig(UploadProperties uploadProperties) {
    this.uploadProperties = uploadProperties;
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    String location = uploadLocation();
    registry.addResourceHandler("/uploads/**").addResourceLocations(location);
  }

  private String uploadLocation() {
    Path root = Paths.get(uploadProperties.getDir()).toAbsolutePath().normalize();
    try {
      Files.createDirectories(root);
    } catch (IOException exception) {
      throw new IllegalStateException("Failed to create upload directory: " + root, exception);
    }
    String location = root.toUri().toString();
    return location.endsWith("/") ? location : location + "/";
  }
}
