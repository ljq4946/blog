package com.example.blog.series;

import com.example.blog.topic.Topic;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "series")
public class Series {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String name;

  @Column(nullable = false, unique = true)
  private String slug;

  @Column(columnDefinition = "TEXT")
  private String description;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "primary_topic_id")
  private Topic primaryTopic;

  @Column(name = "sort_order", nullable = false)
  private int sortOrder;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected Series() {
  }

  public Series(String name, String slug, String description, Topic primaryTopic, int sortOrder) {
    this.name = name;
    this.slug = slug;
    this.description = description;
    this.primaryTopic = primaryTopic;
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

  public void update(String name, String slug, String description, Topic primaryTopic, int sortOrder) {
    this.name = name;
    this.slug = slug;
    this.description = description;
    this.primaryTopic = primaryTopic;
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

  public Topic getPrimaryTopic() {
    return primaryTopic;
  }

  public int getSortOrder() {
    return sortOrder;
  }
}
