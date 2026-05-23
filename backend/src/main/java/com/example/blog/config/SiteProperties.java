package com.example.blog.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.site")
public class SiteProperties {

  private String name = "4946 Blog";
  private String description = "Personal notebook";
  private String baseUrl = "http://localhost:8088";

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getBaseUrl() {
    return baseUrl;
  }

  public void setBaseUrl(String baseUrl) {
    this.baseUrl = baseUrl;
  }

  public String normalizedBaseUrl() {
    return baseUrl == null || baseUrl.isBlank() ? "http://localhost:8088" : baseUrl.replaceAll("/+$", "");
  }
}
