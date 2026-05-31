package com.example.blog.topic;

import com.example.blog.post.Post;
import com.example.blog.post.PostRepository;
import com.example.blog.series.Series;
import com.example.blog.series.SeriesRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@RestController
public class TopicController {

  private final TopicRepository topics;
  private final SeriesRepository series;
  private final PostRepository posts;

  public TopicController(TopicRepository topics, SeriesRepository series, PostRepository posts) {
    this.topics = topics;
    this.series = series;
    this.posts = posts;
  }

  @GetMapping({"/api/v1/topics", "/api/v1/admin/topics"})
  public List<TopicResponse> list() {
    return topics.findAllByOrderBySortOrderAscNameAsc().stream().map(TopicResponse::from).toList();
  }

  @GetMapping("/api/v1/topics/{slug}")
  public TopicDetailResponse detail(@PathVariable String slug) {
    Topic topic = topics.findBySlug(slug).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    return new TopicDetailResponse(
        TopicResponse.from(topic),
        series.findByPrimaryTopicSlugOrderBySortOrderAscNameAsc(slug).stream().map(SeriesSummary::from).toList(),
        posts.findVisibleByTopicsSlugOrderByPublishedAtDescCreatedAtDesc(slug, Instant.now())
            .stream()
            .map(PostSummary::from)
            .toList());
  }

  @PostMapping("/api/v1/admin/topics")
  @ResponseStatus(HttpStatus.CREATED)
  public TopicResponse create(@Valid @RequestBody TopicRequest request) {
    return TopicResponse.from(topics.save(new Topic(
        request.name(), request.slug(), request.description(), request.sortOrder())));
  }

  @PutMapping("/api/v1/admin/topics/{id}")
  public TopicResponse update(@PathVariable Long id, @Valid @RequestBody TopicRequest request) {
    Topic topic = topics.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    topic.update(request.name(), request.slug(), request.description(), request.sortOrder());
    return TopicResponse.from(topics.save(topic));
  }

  @DeleteMapping("/api/v1/admin/topics/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable Long id) {
    topics.deleteById(id);
  }

  public record TopicRequest(@NotBlank String name, @NotBlank String slug, String description, int sortOrder) {
  }

  public record TopicResponse(Long id, String name, String slug, String description, int sortOrder) {
    public static TopicResponse from(Topic topic) {
      return new TopicResponse(
          topic.getId(),
          topic.getName(),
          topic.getSlug(),
          topic.getDescription(),
          topic.getSortOrder());
    }
  }

  public record TopicDetailResponse(TopicResponse topic, List<SeriesSummary> relatedSeries, List<PostSummary> posts) {
  }

  public record SeriesSummary(Long id, String name, String slug, String description, int sortOrder) {
    public static SeriesSummary from(Series series) {
      return new SeriesSummary(
          series.getId(),
          series.getName(),
          series.getSlug(),
          series.getDescription(),
          series.getSortOrder());
    }
  }

  public record PostSummary(Long id, String title, String slug, String summary, String publishedAt) {
    public static PostSummary from(Post post) {
      return new PostSummary(
          post.getId(),
          post.getTitle(),
          post.getSlug(),
          post.getSummary(),
          post.getPublishedAt() == null ? null : post.getPublishedAt().toString());
    }
  }
}
