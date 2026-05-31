package com.example.blog.knowledge;

import com.example.blog.category.Category;
import com.example.blog.media.MediaAsset;
import com.example.blog.post.Post;
import com.example.blog.post.PostDtos.PostResponse;
import com.example.blog.series.Series;
import com.example.blog.tag.Tag;
import com.example.blog.topic.Topic;

import java.time.Instant;
import java.util.List;

public final class KnowledgeDtos {

  private KnowledgeDtos() {
  }

  public record KnowledgeRelationRequest(Long sourcePostId, Long targetPostId, KnowledgeRelationType type) {
  }

  public record KnowledgePostSummary(
      Long id,
      String title,
      String slug,
      String status,
      String visibility,
      String contentType) {
    static KnowledgePostSummary from(Post post) {
      return new KnowledgePostSummary(
          post.getId(),
          post.getTitle(),
          post.getSlug(),
          post.getStatus().name(),
          post.getVisibility().name(),
          post.getContentType().name());
    }
  }

  public record KnowledgeRelationResponse(
      Long id,
      KnowledgePostSummary sourcePost,
      KnowledgePostSummary targetPost,
      String type,
      Instant createdAt) {
    static KnowledgeRelationResponse from(KnowledgeRelation relation) {
      return new KnowledgeRelationResponse(
          relation.getId(),
          KnowledgePostSummary.from(relation.getSourcePost()),
          KnowledgePostSummary.from(relation.getTargetPost()),
          relation.getType().name(),
          relation.getCreatedAt());
    }
  }

  public record KnowledgeExport(
      Instant exportedAt,
      List<PostResponse> posts,
      List<CategoryExport> categories,
      List<TagExport> tags,
      List<TopicExport> topics,
      List<SeriesExport> series,
      List<MediaExport> media) {
  }

  public record CategoryExport(Long id, String name, String slug, String description, int sortOrder) {
    static CategoryExport from(Category category) {
      return new CategoryExport(
          category.getId(),
          category.getName(),
          category.getSlug(),
          category.getDescription(),
          category.getSortOrder());
    }
  }

  public record TagExport(Long id, String name, String slug) {
    static TagExport from(Tag tag) {
      return new TagExport(tag.getId(), tag.getName(), tag.getSlug());
    }
  }

  public record TopicExport(Long id, String name, String slug, String description, int sortOrder) {
    static TopicExport from(Topic topic) {
      return new TopicExport(
          topic.getId(),
          topic.getName(),
          topic.getSlug(),
          topic.getDescription(),
          topic.getSortOrder());
    }
  }

  public record SeriesExport(
      Long id,
      String name,
      String slug,
      String description,
      Long primaryTopicId,
      int sortOrder) {
    static SeriesExport from(Series series) {
      return new SeriesExport(
          series.getId(),
          series.getName(),
          series.getSlug(),
          series.getDescription(),
          series.getPrimaryTopic() == null ? null : series.getPrimaryTopic().getId(),
          series.getSortOrder());
    }
  }

  public record MediaExport(
      Long id,
      String originalName,
      String storedName,
      String url,
      String mimeType,
      long size,
      Integer width,
      Integer height,
      Instant createdAt) {
    static MediaExport from(MediaAsset asset) {
      return new MediaExport(
          asset.getId(),
          asset.getOriginalName(),
          asset.getStoredName(),
          asset.getUrl(),
          asset.getMimeType(),
          asset.getSize(),
          asset.getWidth(),
          asset.getHeight(),
          asset.getCreatedAt());
    }
  }
}
