package com.example.blog.topic;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "topics")
public class Topic {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String name;

  @Column(nullable = false, unique = true)
  private String slug;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(name = "sort_order", nullable = false)
  private int sortOrder;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected Topic() {
  }

  public Topic(String name, String slug, String description, int sortOrder) {
    this.name = name;
    this.slug = slug;
    this.description = description;
    this.sortOrder = sortOrder;
  }

  @PrePersist
  void prePersist() {
    Instant now = Instant.now();
    createdAt = now;
    updatedAt = now;
  }

  @PreUpdate
  void preUpdate() {
    updatedAt = Instant.now();
  }

  public void update(String name, String slug, String description, int sortOrder) {
    this.name = name;
    this.slug = slug;
    this.description = description;
    this.sortOrder = sortOrder;
  }

  public Long getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public String getSlug() {
    return slug;
  }

  public String getDescription() {
    return description;
  }

  public int getSortOrder() {
    return sortOrder;
  }
}
