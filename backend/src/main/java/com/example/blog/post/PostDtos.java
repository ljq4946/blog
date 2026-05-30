package com.example.blog.post;

import com.example.blog.category.Category;
import com.example.blog.series.Series;
import com.example.blog.tag.Tag;
import com.example.blog.topic.Topic;
import org.springframework.data.domain.Page;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.Optional;
import java.util.function.Function;

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
      Set<Long> topicIds,
      Long seriesId,
      Integer seriesOrder,
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
      List<TopicSummary> topics,
      SeriesSummary series,
      Integer seriesOrder,
      SeriesPostSummary previousSeriesPost,
      SeriesPostSummary nextSeriesPost,
      List<TagSummary> tags,
      Instant createdAt,
      Instant updatedAt,
      Instant publishedAt) {
    public static PostResponse from(Post post) {
      return from(post, null);
    }

    public static PostResponse from(Post post, String coverMediaUrl) {
      return from(post, coverMediaUrl, null, null);
    }

    public static PostResponse from(
        Post post,
        String coverMediaUrl,
        SeriesPostSummary previousSeriesPost,
        SeriesPostSummary nextSeriesPost) {
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
          post.getTopics().stream()
              .sorted(Comparator.comparing(Topic::getName))
              .map(TopicSummary::from)
              .toList(),
          post.getSeries() == null ? null : SeriesSummary.from(post.getSeries()),
          post.getSeriesOrder(),
          previousSeriesPost,
          nextSeriesPost,
          post.getTags().stream()
              .sorted(Comparator.comparing(Tag::getName))
              .map(TagSummary::from)
              .toList(),
          post.getCreatedAt(),
          post.getUpdatedAt(),
          post.getPublishedAt());
    }
  }

  public record TopicSummary(Long id, String name, String slug) {
    static TopicSummary from(Topic topic) {
      return new TopicSummary(topic.getId(), topic.getName(), topic.getSlug());
    }
  }

  public record SeriesSummary(Long id, String name, String slug, TopicSummary primaryTopic) {
    static SeriesSummary from(Series series) {
      return new SeriesSummary(
          series.getId(),
          series.getName(),
          series.getSlug(),
          series.getPrimaryTopic() == null ? null : TopicSummary.from(series.getPrimaryTopic()));
    }
  }

  public record SeriesPostSummary(Long id, String title, String slug, Integer seriesOrder) {
    static SeriesPostSummary from(Post post) {
      return new SeriesPostSummary(post.getId(), post.getTitle(), post.getSlug(), post.getSeriesOrder());
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

  public record PageResponse<T>(
      List<T> content,
      int number,
      int size,
      long totalElements,
      int totalPages) {
    public static <S, T> PageResponse<T> from(Page<S> page, Function<S, T> mapper) {
      return new PageResponse<>(
          page.getContent().stream().map(mapper).toList(),
          page.getNumber(),
          page.getSize(),
          page.getTotalElements(),
          page.getTotalPages());
    }
  }

  public record PostSearchRequest(
      Optional<String> keyword,
      Optional<Integer> year,
      Optional<String> category,
      Optional<String> tag,
      Optional<String> topic,
      Optional<String> series,
      Optional<Integer> page,
      Optional<Integer> size,
      Optional<String> sort) {
  }
}
