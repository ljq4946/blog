package com.example.blog.operation;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "operation_logs")
public class OperationLog {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 80)
  private String action;

  @Column(name = "target_type", nullable = false, length = 80)
  private String targetType;

  @Column(name = "target_id")
  private Long targetId;

  @Column(columnDefinition = "TEXT")
  private String message;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  protected OperationLog() {
  }

  public OperationLog(String action, String targetType, Long targetId, String message) {
    this.action = action;
    this.targetType = targetType;
    this.targetId = targetId;
    this.message = message;
  }

  @PrePersist
  void prePersist() {
    createdAt = Instant.now();
  }

  public Long getId() {
    return id;
  }

  public String getAction() {
    return action;
  }

  public String getTargetType() {
    return targetType;
  }

  public Long getTargetId() {
    return targetId;
  }

  public String getMessage() {
    return message;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
