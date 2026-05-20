package com.example.blog.post;

import com.example.blog.category.Category;
import com.example.blog.tag.Tag;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

public final class PostDtos {

  private PostDtos() {
  }

  public record PostRequest(
      String title,
      String slug,
      String summary,
      String contentHtml,
      Long coverMediaId,
      PostStatus status,
      Long categoryId,
      Set<Long> tagIds,
      Instant publishedAt) {
  }

  public record PostResponse(
      Long id,
      String title,
      String slug,
      String summary,
      String contentHtml,
      Long coverMediaId,
      String coverMediaUrl,
      String status,
      CategorySummary category,
      List<TagSummary> tags,
      Instant createdAt,
      Instant updatedAt,
      Instant publishedAt) {
    public static PostResponse from(Post post) {
      return from(post, null);
    }

    public static PostResponse from(Post post, String coverMediaUrl) {
      return new PostResponse(
          post.getId(),
          post.getTitle(),
          post.getSlug(),
          post.getSummary(),
          post.getContentHtml(),
          post.getCoverMediaId(),
          coverMediaUrl,
          post.getStatus().name(),
          post.getCategory() == null ? null : CategorySummary.from(post.getCategory()),
          post.getTags().stream()
              .sorted(Comparator.comparing(Tag::getName))
              .map(TagSummary::from)
              .toList(),
          post.getCreatedAt(),
          post.getUpdatedAt(),
          post.getPublishedAt());
    }
  }

  public record CategorySummary(Long id, String name, String slug) {
    static CategorySummary from(Category category) {
      return new CategorySummary(category.getId(), category.getName(), category.getSlug());
    }
  }

  public record TagSummary(Long id, String name, String slug) {
    static TagSummary from(Tag tag) {
      return new TagSummary(tag.getId(), tag.getName(), tag.getSlug());
    }
  }

  public record ArchiveMonth(String month, List<PostResponse> posts) {
  }
}
