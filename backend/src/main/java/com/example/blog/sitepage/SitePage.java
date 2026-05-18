package com.example.blog.sitepage;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "site_pages")
public class SitePage {

  @Id
  @Column(name = "page_key")
  private String key;

  @Column(nullable = false)
  private String title;

  @Column(name = "content_html", columnDefinition = "LONGTEXT")
  private String contentHtml;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected SitePage() {
  }

  public SitePage(String key, String title, String contentHtml) {
    this.key = key;
    this.title = title;
    this.contentHtml = contentHtml;
  }

  @PrePersist
  @PreUpdate
  void touch() {
    updatedAt = Instant.now();
  }

  public void update(String title, String contentHtml) {
    this.title = title;
    this.contentHtml = contentHtml;
  }

  public String getKey() {
    return key;
  }

  public String getTitle() {
    return title;
  }

  public String getContentHtml() {
    return contentHtml;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
