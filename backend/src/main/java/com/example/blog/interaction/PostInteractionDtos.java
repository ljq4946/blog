package com.example.blog.interaction;

import java.time.Instant;

public final class PostInteractionDtos {

  private PostInteractionDtos() {
  }

  public record CommentRequest(String nickname, String email, String content) {
  }

  public record CommentStatusRequest(String status) {
  }

  public record PublicCommentResponse(Long id, String nickname, String content, String status, Instant createdAt) {
    static PublicCommentResponse from(PostComment comment) {
      return new PublicCommentResponse(
          comment.getId(),
          comment.getNickname(),
          comment.getContent(),
          comment.getStatus().name(),
          comment.getCreatedAt());
    }
  }

  public record AdminCommentResponse(
      Long id,
      Long postId,
      String postTitle,
      String postSlug,
      String nickname,
      String email,
      String content,
      String status,
      Instant createdAt) {
    static AdminCommentResponse from(PostComment comment) {
      return new AdminCommentResponse(
          comment.getId(),
          comment.getPost().getId(),
          comment.getPost().getTitle(),
          comment.getPost().getSlug(),
          comment.getNickname(),
          comment.getEmail(),
          comment.getContent(),
          comment.getStatus().name(),
          comment.getCreatedAt());
    }
  }

  public record LikeResponse(long count) {
  }
}
