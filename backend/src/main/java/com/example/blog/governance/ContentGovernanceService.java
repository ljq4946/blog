package com.example.blog.governance;

import com.example.blog.post.Post;
import com.example.blog.post.PostRepository;
import com.example.blog.post.PostStatus;
import com.example.blog.series.Series;
import com.example.blog.series.SeriesRepository;
import com.example.blog.topic.Topic;
import com.example.blog.topic.TopicRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static com.example.blog.governance.ContentGovernanceDtos.*;

@Service
public class ContentGovernanceService {

  private final PostRepository posts;
  private final TopicRepository topics;
  private final SeriesRepository series;

  public ContentGovernanceService(PostRepository posts, TopicRepository topics, SeriesRepository series) {
    this.posts = posts;
    this.topics = topics;
    this.series = series;
  }

  @Transactional(readOnly = true)
  public ContentGovernanceResponse snapshot() {
    List<Post> allPosts = posts.findAllForAdmin();
    List<TopicCoverage> topicCoverage = topics.findAllByOrderBySortOrderAscNameAsc().stream()
        .map(topic -> topicCoverage(topic, allPosts))
        .toList();
    List<SeriesCoverage> seriesCoverage = series.findAllByOrderBySortOrderAscNameAsc().stream()
        .map(item -> seriesCoverage(item, allPosts))
        .toList();
    List<PostIssue> postIssues = allPosts.stream()
        .map(this::postIssue)
        .filter(issue -> !issue.issues().isEmpty())
        .toList();
    return new ContentGovernanceResponse(
        metrics(allPosts, topicCoverage, seriesCoverage),
        postIssues,
        topicCoverage,
        seriesCoverage);
  }

  private GovernanceMetrics metrics(
      List<Post> allPosts,
      List<TopicCoverage> topicCoverage,
      List<SeriesCoverage> seriesCoverage) {
    return new GovernanceMetrics(
        allPosts.size(),
        allPosts.stream().filter(post -> post.getStatus() == PostStatus.PUBLISHED).count(),
        allPosts.stream().filter(post -> post.getStatus() == PostStatus.DRAFT).count(),
        allPosts.stream().filter(post -> post.getStatus() == PostStatus.SCHEDULED).count(),
        allPosts.stream().filter(post -> isBlank(post.getSummary())).count(),
        allPosts.stream().filter(post -> post.getCoverMediaId() == null).count(),
        allPosts.stream().filter(post -> post.getTopics().isEmpty()).count(),
        topicCoverage.stream().filter(TopicCoverage::empty).count(),
        seriesCoverage.stream().filter(this::hasSeriesIssue).count());
  }

  private PostIssue postIssue(Post post) {
    List<String> issues = new ArrayList<>();
    if (isBlank(post.getSummary())) {
      issues.add("MISSING_SUMMARY");
    }
    if (post.getCoverMediaId() == null) {
      issues.add("MISSING_COVER");
    }
    if (post.getTopics().isEmpty()) {
      issues.add("MISSING_TOPIC");
    }
    return new PostIssue(
        post.getId(),
        post.getTitle(),
        post.getSlug(),
        post.getStatus().name(),
        issues,
        post.getUpdatedAt());
  }

  private TopicCoverage topicCoverage(Topic topic, List<Post> allPosts) {
    List<Post> attachedPosts = allPosts.stream()
        .filter(post -> post.getTopics().stream().anyMatch(candidate -> Objects.equals(candidate.getId(), topic.getId())))
        .toList();
    return new TopicCoverage(
        topic.getId(),
        topic.getName(),
        topic.getSlug(),
        attachedPosts.size(),
        latestUpdatedAt(attachedPosts),
        attachedPosts.isEmpty());
  }

  private SeriesCoverage seriesCoverage(Series series, List<Post> allPosts) {
    List<Post> attachedPosts = allPosts.stream()
        .filter(post -> post.getSeries() != null && Objects.equals(post.getSeries().getId(), series.getId()))
        .toList();
    List<Integer> orders = attachedPosts.stream()
        .map(Post::getSeriesOrder)
        .filter(Objects::nonNull)
        .sorted()
        .toList();
    boolean orderConflict = hasDuplicate(orders);
    return new SeriesCoverage(
        series.getId(),
        series.getName(),
        series.getSlug(),
        attachedPosts.size(),
        latestUpdatedAt(attachedPosts),
        attachedPosts.isEmpty(),
        orderConflict,
        missingOrders(orders));
  }

  private boolean hasSeriesIssue(SeriesCoverage coverage) {
    return coverage.empty() || coverage.orderConflict() || !coverage.missingOrders().isEmpty();
  }

  private Instant latestUpdatedAt(List<Post> posts) {
    return posts.stream()
        .map(Post::getUpdatedAt)
        .filter(Objects::nonNull)
        .max(Instant::compareTo)
        .orElse(null);
  }

  private boolean hasDuplicate(List<Integer> orders) {
    Set<Integer> seen = new HashSet<>();
    return orders.stream().anyMatch(order -> !seen.add(order));
  }

  private List<Integer> missingOrders(List<Integer> orders) {
    if (orders.isEmpty()) {
      return List.of();
    }
    Map<Integer, Integer> orderCounts = orders.stream()
        .collect(Collectors.toMap(Function.identity(), ignored -> 1, Integer::sum));
    int max = orders.getLast();
    return IntStream.rangeClosed(1, max)
        .filter(order -> !orderCounts.containsKey(order))
        .boxed()
        .toList();
  }

  private boolean isBlank(String value) {
    return value == null || value.isBlank();
  }
}
