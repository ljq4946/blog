package com.example.blog.post;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

@Entity
@Table(name = "post_revisions")
public class PostRevision {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "post_id", nullable = false)
  private Post post;

  @Column(nullable = false)
  private String title;

  @Column(nullable = false)
  private String slug;

  @Column(columnDefinition = "TEXT")
  private String summary;

  @Column(name = "content_html", columnDefinition = "LONGTEXT")
  private String contentHtml;

  @Column(name = "cover_media_id")
  private Long coverMediaId;

  @Column(nullable = false)
  private String status;

  @Column(nullable = false)
  private String visibility;

  @Column(name = "content_type", nullable = false)
  private String contentType;

  @Column(name = "category_id")
  private Long categoryId;

  @Column(name = "topic_ids", columnDefinition = "TEXT")
  private String topicIds;

  @Column(name = "tag_ids", columnDefinition = "TEXT")
  private String tagIds;

  @Column(name = "series_id")
  private Long seriesId;

  @Column(name = "series_order")
  private Integer seriesOrder;

  @Column(name = "seo_title")
  private String seoTitle;

  @Column(name = "seo_description", columnDefinition = "TEXT")
  private String seoDescription;

  @Column(name = "published_at")
  private Instant publishedAt;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  protected PostRevision() {
  }

  public PostRevision(Post post) {
    this.post = post;
    this.title = post.getTitle();
    this.slug = post.getSlug();
    this.summary = post.getSummary();
    this.contentHtml = post.getContentHtml();
    this.coverMediaId = post.getCoverMediaId();
    this.status = post.getStatus().name();
    this.visibility = post.getVisibility().name();
    this.contentType = post.getContentType().name();
    this.categoryId = post.getCategory() == null ? null : post.getCategory().getId();
    this.topicIds = ids(post.getTopics().stream().map(topic -> topic.getId()).sorted().toList());
    this.tagIds = ids(post.getTags().stream().map(tag -> tag.getId()).sorted().toList());
    this.seriesId = post.getSeries() == null ? null : post.getSeries().getId();
    this.seriesOrder = post.getSeriesOrder();
    this.seoTitle = post.getSeoTitle();
    this.seoDescription = post.getSeoDescription();
    this.publishedAt = post.getPublishedAt();
  }

  @PrePersist
  void prePersist() {
    createdAt = Instant.now();
  }

  public Long getId() {
    return id;
  }

  public Post getPost() {
    return post;
  }

  public String getTitle() {
    return title;
  }

  public String getSlug() {
    return slug;
  }

  public String getSummary() {
    return summary;
  }

  public String getContentHtml() {
    return contentHtml;
  }

  public Long getCoverMediaId() {
    return coverMediaId;
  }

  public String getStatus() {
    return status;
  }

  public String getVisibility() {
    return visibility;
  }

  public String getContentType() {
    return contentType;
  }

  public Long getCategoryId() {
    return categoryId;
  }

  public Long getSeriesId() {
    return seriesId;
  }

  public Integer getSeriesOrder() {
    return seriesOrder;
  }

  public String getSeoTitle() {
    return seoTitle;
  }

  public String getSeoDescription() {
    return seoDescription;
  }

  public Instant getPublishedAt() {
    return publishedAt;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public List<Long> topicIds() {
    return parseIds(topicIds);
  }

  public List<Long> tagIds() {
    return parseIds(tagIds);
  }

  private String ids(List<Long> ids) {
    return ids.stream().map(String::valueOf).reduce((left, right) -> left + "," + right).orElse("");
  }

  private List<Long> parseIds(String value) {
    if (value == null || value.isBlank()) {
      return List.of();
    }
    return Arrays.stream(value.split(","))
        .filter(part -> !part.isBlank())
        .map(Long::valueOf)
        .toList();
  }
}
