package com.example.blog.media;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "media_assets")
public class MediaAsset {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "original_name", nullable = false)
  private String originalName;

  @Column(name = "stored_name", nullable = false, unique = true)
  private String storedName;

  @Column(nullable = false)
  private String url;

  @Column(name = "mime_type", nullable = false)
  private String mimeType;

  @Column(nullable = false)
  private long size;

  private Integer width;

  private Integer height;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  protected MediaAsset() {
  }

  public MediaAsset(String originalName, String storedName, String url, String mimeType, long size,
      Integer width, Integer height) {
    this.originalName = originalName;
    this.storedName = storedName;
    this.url = url;
    this.mimeType = mimeType;
    this.size = size;
    this.width = width;
    this.height = height;
  }

  @PrePersist
  void prePersist() {
    createdAt = Instant.now();
  }

  public Long getId() {
    return id;
  }

  public String getOriginalName() {
    return originalName;
  }

  public String getStoredName() {
    return storedName;
  }

  public String getUrl() {
    return url;
  }

  public String getMimeType() {
    return mimeType;
  }

  public long getSize() {
    return size;
  }

  public Integer getWidth() {
    return width;
  }

  public Integer getHeight() {
    return height;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
