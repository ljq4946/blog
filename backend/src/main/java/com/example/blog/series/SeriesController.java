package com.example.blog.series;

import com.example.blog.post.Post;
import com.example.blog.post.PostRepository;
import com.example.blog.topic.Topic;
import com.example.blog.topic.TopicRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@RestController
public class SeriesController {

  private final SeriesRepository series;
  private final TopicRepository topics;
  private final PostRepository posts;

  public SeriesController(SeriesRepository series, TopicRepository topics, PostRepository posts) {
    this.series = series;
    this.topics = topics;
    this.posts = posts;
  }

  @GetMapping({"/api/v1/series", "/api/v1/admin/series"})
  public List<SeriesResponse> list() {
    return series.findAllByOrderBySortOrderAscNameAsc().stream().map(SeriesResponse::from).toList();
  }

  @GetMapping("/api/v1/series/{slug}")
  public SeriesDetailResponse detail(@PathVariable String slug) {
    Series found = series.findBySlug(slug).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    return new SeriesDetailResponse(
        SeriesResponse.from(found),
        posts.findVisibleBySeriesSlugOrderBySeriesOrderAsc(slug, Instant.now())
            .stream()
            .map(PostSummary::from)
            .toList());
  }

  @PostMapping("/api/v1/admin/series")
  @ResponseStatus(HttpStatus.CREATED)
  public SeriesResponse create(@Valid @RequestBody SeriesRequest request) {
    Topic primaryTopic = primaryTopic(request.primaryTopicId());
    return SeriesResponse.from(series.save(new Series(
        request.name(), request.slug(), request.description(), primaryTopic, request.sortOrder())));
  }

  @PutMapping("/api/v1/admin/series/{id}")
  public SeriesResponse update(@PathVariable Long id, @Valid @RequestBody SeriesRequest request) {
    Series found = series.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    found.update(
        request.name(),
        request.slug(),
        request.description(),
        primaryTopic(request.primaryTopicId()),
        request.sortOrder());
    return SeriesResponse.from(series.save(found));
  }

  @DeleteMapping("/api/v1/admin/series/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable Long id) {
    if (posts.existsBySeriesId(id)) {
      throw new IllegalArgumentException("Series has attached posts");
    }
    series.deleteById(id);
  }

  private Topic primaryTopic(Long id) {
    return id == null ? null : topics.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Unknown topic"));
  }

  public record SeriesRequest(
      @NotBlank String name,
      @NotBlank String slug,
      String description,
      Long primaryTopicId,
      int sortOrder) {
  }

  public record TopicSummary(Long id, String name, String slug) {
    public static TopicSummary from(Topic topic) {
      return new TopicSummary(topic.getId(), topic.getName(), topic.getSlug());
    }
  }

  public record SeriesResponse(
      Long id,
      String name,
      String slug,
      String description,
      TopicSummary primaryTopic,
      int sortOrder) {
    public static SeriesResponse from(Series series) {
      return new SeriesResponse(
          series.getId(),
          series.getName(),
          series.getSlug(),
          series.getDescription(),
          series.getPrimaryTopic() == null ? null : TopicSummary.from(series.getPrimaryTopic()),
          series.getSortOrder());
    }
  }

  public record SeriesDetailResponse(SeriesResponse series, List<PostSummary> posts) {
  }

  public record PostSummary(Long id, String title, String slug, String summary, Integer seriesOrder, String publishedAt) {
    public static PostSummary from(Post post) {
      return new PostSummary(
          post.getId(),
          post.getTitle(),
          post.getSlug(),
          post.getSummary(),
          post.getSeriesOrder(),
          post.getPublishedAt() == null ? null : post.getPublishedAt().toString());
    }
  }
}
