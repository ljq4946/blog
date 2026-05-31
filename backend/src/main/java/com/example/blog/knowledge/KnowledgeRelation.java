package com.example.blog.knowledge;

import com.example.blog.post.Post;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "knowledge_relations")
public class KnowledgeRelation {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "source_post_id", nullable = false)
  private Post sourcePost;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "target_post_id", nullable = false)
  private Post targetPost;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private KnowledgeRelationType type;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  protected KnowledgeRelation() {
  }

  public KnowledgeRelation(Post sourcePost, Post targetPost, KnowledgeRelationType type) {
    this.sourcePost = sourcePost;
    this.targetPost = targetPost;
    this.type = type;
  }

  @PrePersist
  void prePersist() {
    createdAt = Instant.now();
  }

  public Long getId() {
    return id;
  }

  public Post getSourcePost() {
    return sourcePost;
  }

  public Post getTargetPost() {
    return targetPost;
  }

  public KnowledgeRelationType getType() {
    return type;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
