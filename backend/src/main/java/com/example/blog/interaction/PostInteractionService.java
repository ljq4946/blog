package com.example.blog.interaction;

import com.example.blog.post.Post;
import com.example.blog.post.PostRepository;
import com.example.blog.post.PostStatus;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static com.example.blog.interaction.PostInteractionDtos.*;

@Service
public class PostInteractionService {

  private static final int MAX_NICKNAME_LENGTH = 80;
  private static final int MAX_EMAIL_LENGTH = 160;
  private static final int MAX_CONTENT_LENGTH = 1000;

  private final PostRepository posts;
  private final PostCommentRepository comments;

  public PostInteractionService(PostRepository posts, PostCommentRepository comments) {
    this.posts = posts;
    this.comments = comments;
  }

  @Transactional(readOnly = true)
  public List<PublicCommentResponse> publicComments(String slug) {
    return comments.findByPostSlugAndPostStatusOrderByCreatedAtAsc(slug, PostStatus.PUBLISHED).stream()
        .map(PublicCommentResponse::from)
        .toList();
  }

  @Transactional
  public PublicCommentResponse createComment(String slug, CommentRequest request) {
    Post post = posts.findBySlugAndStatus(slug, PostStatus.PUBLISHED)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    PostComment comment = new PostComment(
        post,
        requiredText(request.nickname(), "nickname", MAX_NICKNAME_LENGTH),
        optionalText(request.email(), "email", MAX_EMAIL_LENGTH),
        requiredText(request.content(), "content", MAX_CONTENT_LENGTH));
    return PublicCommentResponse.from(comments.save(comment));
  }

  @Transactional(readOnly = true)
  public List<AdminCommentResponse> adminComments() {
    return comments.findAllForAdmin().stream()
        .map(AdminCommentResponse::from)
        .toList();
  }

  @Transactional
  public void deleteComment(Long id) {
    comments.deleteById(id);
  }

  @Transactional(readOnly = true)
  public LikeResponse likes(String slug) {
    long count = posts.findLikeCountBySlugAndStatus(slug, PostStatus.PUBLISHED)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    return new LikeResponse(count);
  }

  @Transactional
  public LikeResponse like(String slug) {
    int updated = posts.incrementLikeCount(slug, PostStatus.PUBLISHED);
    if (updated == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
    return likes(slug);
  }

  private String requiredText(String value, String field, int maxLength) {
    String normalized = normalize(value);
    if (normalized.isBlank()) {
      throw new IllegalArgumentException(field + " is required");
    }
    if (normalized.length() > maxLength) {
      throw new IllegalArgumentException(field + " must be at most " + maxLength + " characters");
    }
    return normalized;
  }

  private String optionalText(String value, String field, int maxLength) {
    String normalized = normalize(value);
    if (normalized.isBlank()) {
      return null;
    }
    if (normalized.length() > maxLength) {
      throw new IllegalArgumentException(field + " must be at most " + maxLength + " characters");
    }
    return normalized;
  }

  private String normalize(String value) {
    return value == null ? "" : value.trim();
  }
}
