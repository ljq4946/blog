package com.example.blog.knowledge;

import com.example.blog.category.CategoryRepository;
import com.example.blog.media.MediaAssetRepository;
import com.example.blog.operation.OperationLogService;
import com.example.blog.post.*;
import com.example.blog.series.SeriesRepository;
import com.example.blog.tag.TagRepository;
import com.example.blog.topic.TopicRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Stream;

import static com.example.blog.knowledge.KnowledgeDtos.*;

@Service
public class KnowledgeService {

  private final PostRepository posts;
  private final KnowledgeRelationRepository relations;
  private final CategoryRepository categories;
  private final TagRepository tags;
  private final TopicRepository topics;
  private final SeriesRepository series;
  private final MediaAssetRepository media;
  private final OperationLogService operationLogs;

  public KnowledgeService(
      PostRepository posts,
      KnowledgeRelationRepository relations,
      CategoryRepository categories,
      TagRepository tags,
      TopicRepository topics,
      SeriesRepository series,
      MediaAssetRepository media,
      OperationLogService operationLogs) {
    this.posts = posts;
    this.relations = relations;
    this.categories = categories;
    this.tags = tags;
    this.topics = topics;
    this.series = series;
    this.media = media;
    this.operationLogs = operationLogs;
  }

  @Transactional(readOnly = true)
  public PostDtos.PageResponse<PostDtos.PostResponse> search(
      Optional<String> keyword,
      Optional<PostVisibility> visibility,
      Optional<PostContentType> contentType,
      Optional<Integer> page,
      Optional<Integer> size) {
    List<PostDtos.PostResponse> matches = posts.findAllForAdmin().stream()
        .filter(post -> visibility.map(value -> post.getVisibility() == value).orElse(true))
        .filter(post -> contentType.map(value -> post.getContentType() == value).orElse(true))
        .filter(post -> keywordMatches(post, keyword))
        .map(PostDtos.PostResponse::from)
        .toList();
    int normalizedPage = Math.max(0, page.orElse(0));
    int normalizedSize = Math.min(Math.max(1, size.orElse(20)), 50);
    int fromIndex = Math.min(normalizedPage * normalizedSize, matches.size());
    int toIndex = Math.min(fromIndex + normalizedSize, matches.size());
    int totalPages = matches.isEmpty() ? 0 : (int) Math.ceil((double) matches.size() / normalizedSize);
    return new PostDtos.PageResponse<>(
        matches.subList(fromIndex, toIndex),
        normalizedPage,
        normalizedSize,
        matches.size(),
        totalPages);
  }

  @Transactional(readOnly = true)
  public List<KnowledgeRelationResponse> relations(Optional<Long> postId) {
    List<KnowledgeRelation> found = postId
        .map(relations::findForPost)
        .orElseGet(relations::findAllByOrderByCreatedAtDesc);
    return found.stream().map(KnowledgeRelationResponse::from).toList();
  }

  @Transactional
  public KnowledgeRelationResponse createRelation(KnowledgeRelationRequest request) {
    Post source = posts.findById(requiredId(request.sourcePostId(), "sourcePostId"))
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    Post target = posts.findById(requiredId(request.targetPostId(), "targetPostId"))
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    if (source.getId().equals(target.getId())) {
      throw new IllegalArgumentException("sourcePostId and targetPostId must be different");
    }
    KnowledgeRelationType type = request.type() == null ? KnowledgeRelationType.RELATED : request.type();
    KnowledgeRelation saved = relations.save(new KnowledgeRelation(source, target, type));
    operationLogs.record("knowledge.relation.create", "knowledge-relation", saved.getId(), type.name());
    return KnowledgeRelationResponse.from(saved);
  }

  @Transactional
  public void deleteRelation(Long id) {
    relations.deleteById(id);
    operationLogs.record("knowledge.relation.delete", "knowledge-relation", id, "Deleted relation");
  }

  @Transactional
  public PostDtos.PostResponse convertToArticle(Long noteId) {
    Post note = posts.findById(noteId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    if (note.getContentType() != PostContentType.NOTE) {
      throw new IllegalArgumentException("Only notes can be converted to article drafts");
    }
    Post article = new Post(
        note.getTitle(),
        uniqueArticleSlug(note.getSlug()),
        note.getSummary(),
        note.getContentHtml(),
        PostStatus.DRAFT);
    article.setVisibility(PostVisibility.PUBLIC);
    article.setContentType(PostContentType.ARTICLE);
    article.setSeoTitle(note.getSeoTitle());
    article.setSeoDescription(note.getSeoDescription());
    article.setCoverMediaId(note.getCoverMediaId());
    article.setCategory(note.getCategory());
    article.setTags(note.getTags());
    article.setTopics(note.getTopics());
    Post saved = posts.save(article);
    relations.save(new KnowledgeRelation(note, saved, KnowledgeRelationType.EXPANDS));
    operationLogs.record("knowledge.note.convert", "post", saved.getId(), note.getTitle());
    return PostDtos.PostResponse.from(saved);
  }

  @Transactional(readOnly = true)
  public KnowledgeExport export() {
    return new KnowledgeExport(
        Instant.now(),
        posts.findAllForAdmin().stream().map(PostDtos.PostResponse::from).toList(),
        categories.findAll().stream().map(CategoryExport::from).toList(),
        tags.findAll().stream().map(TagExport::from).toList(),
        topics.findAll().stream().map(TopicExport::from).toList(),
        series.findAll().stream().map(SeriesExport::from).toList(),
        media.findAll().stream().map(MediaExport::from).toList());
  }

  private boolean keywordMatches(Post post, Optional<String> keyword) {
    String normalized = keyword.map(String::trim).filter(value -> !value.isBlank()).orElse("");
    if (normalized.isBlank()) {
      return true;
    }
    String pattern = normalized.toLowerCase(Locale.ROOT);
    return searchableText(post).anyMatch(value -> value.toLowerCase(Locale.ROOT).contains(pattern));
  }

  private Stream<String> searchableText(Post post) {
    return Stream.of(
        Stream.of(post.getTitle(), post.getSlug(), post.getSummary(), post.getContentHtml()),
        post.getCategory() == null ? Stream.<String>empty() : Stream.of(post.getCategory().getName(), post.getCategory().getSlug()),
        post.getTopics().stream().flatMap(topic -> Stream.of(topic.getName(), topic.getSlug())),
        post.getSeries() == null ? Stream.<String>empty() : Stream.of(post.getSeries().getName(), post.getSeries().getSlug()),
        post.getTags().stream().flatMap(tag -> Stream.of(tag.getName(), tag.getSlug())))
        .flatMap(value -> value)
        .filter(value -> value != null && !value.isBlank());
  }

  private Long requiredId(Long id, String field) {
    if (id == null) {
      throw new IllegalArgumentException(field + " is required");
    }
    return id;
  }

  private String uniqueArticleSlug(String sourceSlug) {
    String base = (sourceSlug == null || sourceSlug.isBlank() ? "note" : sourceSlug) + "-article";
    String candidate = base;
    int suffix = 2;
    while (posts.existsBySlug(candidate)) {
      candidate = base + "-" + suffix;
      suffix += 1;
    }
    return candidate;
  }
}
