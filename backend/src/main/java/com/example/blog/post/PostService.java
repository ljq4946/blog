package com.example.blog.post;

import com.example.blog.category.Category;
import com.example.blog.category.CategoryRepository;
import com.example.blog.security.html.HtmlSanitizer;
import com.example.blog.tag.Tag;
import com.example.blog.tag.TagRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
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
  private final HtmlSanitizer sanitizer;

  public PostService(PostRepository posts, CategoryRepository categories, TagRepository tags, HtmlSanitizer sanitizer) {
    this.posts = posts;
    this.categories = categories;
    this.tags = tags;
    this.sanitizer = sanitizer;
  }

  @Transactional(readOnly = true)
  public List<PostResponse> adminList() {
    return posts.findAllForAdmin().stream().map(PostResponse::from).toList();
  }

  @Transactional(readOnly = true)
  public List<PostResponse> publicList(Optional<String> categorySlug, Optional<String> tagSlug) {
    return posts.findByStatusOrderByPublishedAtDescCreatedAtDesc(PostStatus.PUBLISHED).stream()
        .filter(post -> categorySlug.map(slug -> post.getCategory() != null && slug.equals(post.getCategory().getSlug()))
            .orElse(true))
        .filter(post -> tagSlug.map(slug -> post.getTags().stream().anyMatch(tag -> slug.equals(tag.getSlug())))
            .orElse(true))
        .map(PostResponse::from)
        .toList();
  }

  @Transactional(readOnly = true)
  public PostResponse publicDetail(String slug) {
    return posts.findBySlugAndStatus(slug, PostStatus.PUBLISHED)
        .map(PostResponse::from)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
  }

  @Transactional(readOnly = true)
  public List<ArchiveMonth> archive() {
    return posts.findByStatusOrderByPublishedAtDescCreatedAtDesc(PostStatus.PUBLISHED).stream()
        .collect(Collectors.groupingBy(
            post -> ARCHIVE_MONTH.format(post.getPublishedAt() == null ? post.getCreatedAt() : post.getPublishedAt()),
            LinkedHashMap::new,
            Collectors.mapping(PostResponse::from, Collectors.toList())))
        .entrySet()
        .stream()
        .map(entry -> new ArchiveMonth(entry.getKey(), entry.getValue()))
        .toList();
  }

  @Transactional
  public PostResponse create(PostRequest request) {
    Post post = new Post(request.title(), request.slug(), request.summary(), "", PostStatus.DRAFT);
    apply(post, request);
    return PostResponse.from(posts.save(post));
  }

  @Transactional
  public PostResponse update(Long id, PostRequest request) {
    Post post = posts.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    apply(post, request);
    return PostResponse.from(posts.save(post));
  }

  @Transactional
  public void delete(Long id) {
    posts.deleteById(id);
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
  }

  private String required(String value, String field) {
    if (value == null || value.isBlank()) {
      throw new IllegalArgumentException(field + " is required");
    }
    return value;
  }
}
