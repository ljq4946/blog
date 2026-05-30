package com.example.blog.post;

import com.example.blog.category.Category;
import com.example.blog.category.CategoryRepository;
import com.example.blog.media.MediaAssetRepository;
import com.example.blog.security.html.HtmlSanitizer;
import com.example.blog.series.Series;
import com.example.blog.series.SeriesRepository;
import com.example.blog.tag.Tag;
import com.example.blog.tag.TagRepository;
import com.example.blog.topic.Topic;
import com.example.blog.topic.TopicRepository;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

import static com.example.blog.post.PostDtos.*;

@Service
public class PostService {

  private static final DateTimeFormatter ARCHIVE_MONTH = DateTimeFormatter.ofPattern("yyyy-MM").withZone(ZoneOffset.UTC);
  private final PostRepository posts;
  private final CategoryRepository categories;
  private final TagRepository tags;
  private final TopicRepository topics;
  private final SeriesRepository series;
  private final MediaAssetRepository media;
  private final HtmlSanitizer sanitizer;

  public PostService(PostRepository posts, CategoryRepository categories, TagRepository tags,
      TopicRepository topics, SeriesRepository series, MediaAssetRepository media, HtmlSanitizer sanitizer) {
    this.posts = posts;
    this.categories = categories;
    this.tags = tags;
    this.topics = topics;
    this.series = series;
    this.media = media;
    this.sanitizer = sanitizer;
  }

  @Transactional(readOnly = true)
  public List<PostResponse> adminList() {
    return posts.findAllForAdmin().stream().map(this::response).toList();
  }

  @Transactional(readOnly = true)
  public List<PostResponse> publicList(Optional<String> categorySlug, Optional<String> tagSlug) {
    return posts.findByStatusOrderByPublishedAtDescCreatedAtDesc(PostStatus.PUBLISHED).stream()
        .filter(post -> categorySlug.map(slug -> post.getCategory() != null && slug.equals(post.getCategory().getSlug()))
            .orElse(true))
        .filter(post -> tagSlug.map(slug -> post.getTags().stream().anyMatch(tag -> slug.equals(tag.getSlug())))
            .orElse(true))
        .map(this::response)
        .toList();
  }

  @Transactional(readOnly = true)
  public PageResponse<PostResponse> search(PostSearchRequest request) {
    Pageable pageable = PageRequest.of(
        normalizedPage(request.page()),
        normalizedSize(request.size()),
        publicSort(request.sort()));

    Specification<Post> spec = Specification.where(publishedPosts())
        .and(keywordMatches(request.keyword()))
        .and(publishedInYear(request.year()))
        .and(categorySlugMatches(request.category()))
        .and(tagSlugMatches(request.tag()))
        .and(topicSlugMatches(request.topic()))
        .and(seriesSlugMatches(request.series()));

    return PageResponse.from(posts.findAll(spec, pageable), this::response);
  }

  @Transactional(readOnly = true)
  public PostResponse publicDetail(String slug) {
    Post post = posts.findBySlugAndStatus(slug, PostStatus.PUBLISHED)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    return responseWithSeriesNavigation(post);
  }

  @Transactional(readOnly = true)
  public List<ArchiveMonth> archive() {
    return posts.findByStatusOrderByPublishedAtDescCreatedAtDesc(PostStatus.PUBLISHED).stream()
        .collect(Collectors.groupingBy(
            post -> ARCHIVE_MONTH.format(post.getPublishedAt() == null ? post.getCreatedAt() : post.getPublishedAt()),
            LinkedHashMap::new,
            Collectors.mapping(this::response, Collectors.toList())))
        .entrySet()
        .stream()
        .map(entry -> new ArchiveMonth(entry.getKey(), entry.getValue()))
        .toList();
  }

  @Transactional
  public PostResponse create(PostRequest request) {
    Post post = new Post(request.title(), request.slug(), request.summary(), "", PostStatus.DRAFT);
    apply(post, request);
    return response(posts.save(post));
  }

  @Transactional
  public PostResponse update(Long id, PostRequest request) {
    Post post = posts.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    apply(post, request);
    return response(posts.save(post));
  }

  @Transactional
  public void delete(Long id) {
    posts.deleteById(id);
  }

  private int normalizedPage(Optional<Integer> page) {
    return Math.max(0, page.orElse(0));
  }

  private int normalizedSize(Optional<Integer> size) {
    int requested = size.orElse(10);
    if (requested < 1) {
      return 10;
    }
    return Math.min(requested, 50);
  }

  private Sort publicSort(Optional<String> requestedSort) {
    return switch (requestedSort.map(String::trim).orElse("publishedAt,desc")) {
      case "publishedAt,asc" -> Sort.by(Sort.Direction.ASC, "publishedAt");
      case "title,asc" -> Sort.by(Sort.Direction.ASC, "title");
      case "title,desc" -> Sort.by(Sort.Direction.DESC, "title");
      default -> Sort.by(Sort.Direction.DESC, "publishedAt");
    };
  }

  private Optional<String> normalizedText(Optional<String> value) {
    return value.map(String::trim).filter(text -> !text.isBlank());
  }

  private Specification<Post> publishedPosts() {
    return (root, query, criteria) -> criteria.equal(root.get("status"), PostStatus.PUBLISHED);
  }

  private Specification<Post> keywordMatches(Optional<String> keyword) {
    Optional<String> normalized = normalizedText(keyword).map(text -> "%" + text.toLowerCase(Locale.ROOT) + "%");
    return normalized
        .<Specification<Post>>map(pattern -> (root, query, criteria) -> criteria.or(
            criteria.like(criteria.lower(root.get("title")), pattern),
            criteria.like(criteria.lower(root.get("summary")), pattern),
            criteria.like(criteria.lower(root.get("contentHtml")), pattern)))
        .orElse(null);
  }

  private Specification<Post> publishedInYear(Optional<Integer> year) {
    return year
        .filter(value -> value > 0)
        .<Specification<Post>>map(value -> {
          Instant start = LocalDate.of(value, 1, 1).atStartOfDay(ZoneOffset.UTC).toInstant();
          Instant end = LocalDate.of(value + 1, 1, 1).atStartOfDay(ZoneOffset.UTC).toInstant();
          return (root, query, criteria) -> criteria.and(
              criteria.greaterThanOrEqualTo(root.get("publishedAt"), start),
              criteria.lessThan(root.get("publishedAt"), end));
        })
        .orElse(null);
  }

  private Specification<Post> categorySlugMatches(Optional<String> categorySlug) {
    return normalizedText(categorySlug)
        .<Specification<Post>>map(slug -> (root, query, criteria) ->
            criteria.equal(root.join("category", JoinType.INNER).get("slug"), slug))
        .orElse(null);
  }

  private Specification<Post> tagSlugMatches(Optional<String> tagSlug) {
    return normalizedText(tagSlug)
        .<Specification<Post>>map(slug -> (root, query, criteria) -> {
          query.distinct(true);
          return criteria.equal(root.join("tags", JoinType.INNER).get("slug"), slug);
        })
        .orElse(null);
  }

  private Specification<Post> topicSlugMatches(Optional<String> topicSlug) {
    return normalizedText(topicSlug)
        .<Specification<Post>>map(slug -> (root, query, criteria) -> {
          query.distinct(true);
          return criteria.equal(root.join("topics", JoinType.INNER).get("slug"), slug);
        })
        .orElse(null);
  }

  private Specification<Post> seriesSlugMatches(Optional<String> seriesSlug) {
    return normalizedText(seriesSlug)
        .<Specification<Post>>map(slug -> (root, query, criteria) ->
            criteria.equal(root.join("series", JoinType.INNER).get("slug"), slug))
        .orElse(null);
  }

  private void apply(Post post, PostRequest request) {
    post.setTitle(required(request.title(), "title"));
    post.setSlug(required(request.slug(), "slug"));
    post.setSummary(request.summary());
    post.setContentHtml(sanitizer.sanitize(request.contentHtml()));
    post.setCoverMediaId(request.coverMediaId());
    post.setStatus(request.status() == null ? PostStatus.DRAFT : request.status());
    post.setPublishedAt(request.publishedAt());
    if (post.getStatus() == PostStatus.PUBLISHED && post.getPublishedAt() == null) {
      post.setPublishedAt(Instant.now());
    }
    Category category = request.categoryId() == null ? null : categories.findById(request.categoryId())
        .orElseThrow(() -> new IllegalArgumentException("Unknown category"));
    post.setCategory(category);
    Set<Long> tagIds = request.tagIds() == null ? Set.of() : request.tagIds();
    List<Tag> selectedTags = tags.findAllById(tagIds);
    if (selectedTags.size() != tagIds.size()) {
      throw new IllegalArgumentException("Unknown tag");
    }
    post.setTags(new HashSet<>(selectedTags));

    Set<Long> topicIds = request.topicIds() == null ? Set.of() : request.topicIds();
    List<Topic> selectedTopics = topics.findAllById(topicIds);
    if (selectedTopics.size() != topicIds.size()) {
      throw new IllegalArgumentException("Unknown topic");
    }
    post.setTopics(new HashSet<>(selectedTopics));

    if (request.seriesId() == null) {
      if (request.seriesOrder() != null) {
        throw new IllegalArgumentException("seriesOrder requires seriesId");
      }
      post.setSeries(null);
      post.setSeriesOrder(null);
    } else {
      if (request.seriesOrder() == null || request.seriesOrder() < 1) {
        throw new IllegalArgumentException("seriesOrder must be a positive number");
      }
      Series selectedSeries = series.findById(request.seriesId())
          .orElseThrow(() -> new IllegalArgumentException("Unknown series"));
      post.setSeries(selectedSeries);
      post.setSeriesOrder(request.seriesOrder());
    }
  }

  private String required(String value, String field) {
    if (value == null || value.isBlank()) {
      throw new IllegalArgumentException(field + " is required");
    }
    return value;
  }

  private PostResponse response(Post post) {
    return PostResponse.from(post, coverMediaUrl(post));
  }

  private PostResponse responseWithSeriesNavigation(Post post) {
    SeriesPostSummary previous = null;
    SeriesPostSummary next = null;
    if (post.getSeries() != null && post.getSeriesOrder() != null) {
      Long seriesId = post.getSeries().getId();
      previous = posts.findFirstBySeriesIdAndStatusAndSeriesOrderLessThanOrderBySeriesOrderDesc(
              seriesId, PostStatus.PUBLISHED, post.getSeriesOrder())
          .map(SeriesPostSummary::from)
          .orElse(null);
      next = posts.findFirstBySeriesIdAndStatusAndSeriesOrderGreaterThanOrderBySeriesOrderAsc(
              seriesId, PostStatus.PUBLISHED, post.getSeriesOrder())
          .map(SeriesPostSummary::from)
          .orElse(null);
    }
    return PostResponse.from(post, coverMediaUrl(post), previous, next);
  }

  private String coverMediaUrl(Post post) {
    Long coverMediaId = post.getCoverMediaId();
    if (coverMediaId == null) {
      return null;
    }
    return media.findById(coverMediaId).map(asset -> asset.getUrl()).orElse(null);
  }
}
