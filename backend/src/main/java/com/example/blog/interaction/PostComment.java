package com.example.blog.interaction;

import com.example.blog.post.Post;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "post_comments")
public class PostComment {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "post_id", nullable = false)
  private Post post;

  @Column(nullable = false, length = 80)
  private String nickname;

  @Column(length = 160)
  private String email;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String content;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private CommentStatus status = CommentStatus.PENDING;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  protected PostComment() {
  }

  public PostComment(Post post, String nickname, String email, String content) {
    this.post = post;
    this.nickname = nickname;
    this.email = email;
    this.content = content;
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

  public String getNickname() {
    return nickname;
  }

  public String getEmail() {
    return email;
  }

  public String getContent() {
    return content;
  }

  public CommentStatus getStatus() {
    return status;
  }

  public void setStatus(CommentStatus status) {
    this.status = status;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
