package com.example.blog.post;

import com.example.blog.category.Category;
import com.example.blog.series.Series;
import com.example.blog.tag.Tag;
import com.example.blog.topic.Topic;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "posts")
public class Post {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String title;

  @Column(nullable = false, unique = true)
  private String slug;

  @Column(columnDefinition = "TEXT")
  private String summary;

  @Column(name = "seo_title")
  private String seoTitle;

  @Column(name = "seo_description", columnDefinition = "TEXT")
  private String seoDescription;

  @Column(name = "content_html", columnDefinition = "LONGTEXT")
  private String contentHtml;

  @Column(name = "cover_media_id")
  private Long coverMediaId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private PostStatus status = PostStatus.DRAFT;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private PostVisibility visibility = PostVisibility.PUBLIC;

  @Enumerated(EnumType.STRING)
  @Column(name = "content_type", nullable = false)
  private PostContentType contentType = PostContentType.ARTICLE;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "category_id")
  private Category category;

  @ManyToMany
  @JoinTable(
      name = "post_tags",
      joinColumns = @JoinColumn(name = "post_id"),
      inverseJoinColumns = @JoinColumn(name = "tag_id"))
  private Set<Tag> tags = new HashSet<>();

  @ManyToMany
  @JoinTable(
      name = "post_topics",
      joinColumns = @JoinColumn(name = "post_id"),
      inverseJoinColumns = @JoinColumn(name = "topic_id"))
  private Set<Topic> topics = new HashSet<>();

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "series_id")
  private Series series;

  @Column(name = "series_order")
  private Integer seriesOrder;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @Column(name = "published_at")
  private Instant publishedAt;

  @Column(name = "like_count", nullable = false)
  private long likeCount = 0;

  @Column(name = "view_count", nullable = false)
  private long viewCount = 0;

  protected Post() {
  }

  public Post(String title, String slug, String summary, String contentHtml, PostStatus status) {
    this.title = title;
    this.slug = slug;
    this.summary = summary;
    this.contentHtml = contentHtml;
    this.status = status;
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

  public Long getId() {
    return id;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getSlug() {
    return slug;
  }

  public void setSlug(String slug) {
    this.slug = slug;
  }

  public String getSummary() {
    return summary;
  }

  public void setSummary(String summary) {
    this.summary = summary;
  }

  public String getSeoTitle() {
    return seoTitle;
  }

  public void setSeoTitle(String seoTitle) {
    this.seoTitle = seoTitle;
  }

  public String getSeoDescription() {
    return seoDescription;
  }

  public void setSeoDescription(String seoDescription) {
    this.seoDescription = seoDescription;
  }

  public String getContentHtml() {
    return contentHtml;
  }

  public void setContentHtml(String contentHtml) {
    this.contentHtml = contentHtml;
  }

  public Long getCoverMediaId() {
    return coverMediaId;
  }

  public void setCoverMediaId(Long coverMediaId) {
    this.coverMediaId = coverMediaId;
  }

  public PostStatus getStatus() {
    return status;
  }

  public void setStatus(PostStatus status) {
    this.status = status;
  }

  public PostVisibility getVisibility() {
    return visibility;
  }

  public void setVisibility(PostVisibility visibility) {
    this.visibility = visibility;
  }

  public PostContentType getContentType() {
    return contentType;
  }

  public void setContentType(PostContentType contentType) {
    this.contentType = contentType;
  }

  public Category getCategory() {
    return category;
  }

  public void setCategory(Category category) {
    this.category = category;
  }

  public Set<Tag> getTags() {
    return tags;
  }

  public void setTags(Set<Tag> tags) {
    this.tags = new HashSet<>(tags);
  }

  public Set<Topic> getTopics() {
    return topics;
  }

  public void setTopics(Set<Topic> topics) {
    this.topics = new HashSet<>(topics);
  }

  public Series getSeries() {
    return series;
  }

  public void setSeries(Series series) {
    this.series = series;
  }

  public Integer getSeriesOrder() {
    return seriesOrder;
  }

  public void setSeriesOrder(Integer seriesOrder) {
    this.seriesOrder = seriesOrder;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public Instant getPublishedAt() {
    return publishedAt;
  }

  public void setPublishedAt(Instant publishedAt) {
    this.publishedAt = publishedAt;
  }

  public long getLikeCount() {
    return likeCount;
  }

  public long getViewCount() {
    return viewCount;
  }

  public void incrementViewCount() {
    viewCount += 1;
  }
}
