package com.example.blog.interaction;

import java.time.Instant;

public final class PostInteractionDtos {

  private PostInteractionDtos() {
  }

  public record CommentRequest(String nickname, String email, String content) {
  }

  public record PublicCommentResponse(Long id, String nickname, String content, Instant createdAt) {
    static PublicCommentResponse from(PostComment comment) {
      return new PublicCommentResponse(
          comment.getId(),
          comment.getNickname(),
          comment.getContent(),
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
          comment.getCreatedAt());
    }
  }

  public record LikeResponse(long count) {
  }
}
