package com.example.blog.interaction;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.example.blog.interaction.PostInteractionDtos.*;

@RestController
public class PostInteractionController {

  private final PostInteractionService interactions;

  public PostInteractionController(PostInteractionService interactions) {
    this.interactions = interactions;
  }

  @GetMapping("/api/v1/posts/{slug}/comments")
  public List<PublicCommentResponse> publicComments(@PathVariable String slug) {
    return interactions.publicComments(slug);
  }

  @PostMapping("/api/v1/posts/{slug}/comments")
  @ResponseStatus(HttpStatus.CREATED)
  public PublicCommentResponse createComment(@PathVariable String slug, @RequestBody CommentRequest request) {
    return interactions.createComment(slug, request);
  }

  @GetMapping("/api/v1/posts/{slug}/likes")
  public LikeResponse likes(@PathVariable String slug) {
    return interactions.likes(slug);
  }

  @PostMapping("/api/v1/posts/{slug}/likes")
  public LikeResponse like(@PathVariable String slug) {
    return interactions.like(slug);
  }

  @GetMapping("/api/v1/admin/comments")
  public List<AdminCommentResponse> adminComments() {
    return interactions.adminComments();
  }

  @DeleteMapping("/api/v1/admin/comments/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteComment(@PathVariable Long id) {
    interactions.deleteComment(id);
  }

  @PutMapping("/api/v1/admin/comments/{id}/status")
  public AdminCommentResponse updateCommentStatus(@PathVariable Long id, @RequestBody CommentStatusRequest request) {
    return interactions.updateCommentStatus(id, request);
  }
}
