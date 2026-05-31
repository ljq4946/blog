package com.example.blog.post;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.time.Instant;

public interface PostRepository extends JpaRepository<Post, Long>, JpaSpecificationExecutor<Post> {

  @EntityGraph(attributePaths = {"category", "tags", "topics", "series", "series.primaryTopic"})
  List<Post> findByStatusOrderByPublishedAtDescCreatedAtDesc(PostStatus status);

  @EntityGraph(attributePaths = {"category", "tags", "topics", "series", "series.primaryTopic"})
  @Query("""
      select p from Post p
      where p.visibility = com.example.blog.post.PostVisibility.PUBLIC
        and p.contentType = com.example.blog.post.PostContentType.ARTICLE
        and (p.status = com.example.blog.post.PostStatus.PUBLISHED
         or (p.status = com.example.blog.post.PostStatus.SCHEDULED and p.publishedAt <= :now))
      order by p.publishedAt desc, p.createdAt desc
      """)
  List<Post> findVisibleOrderByPublishedAtDescCreatedAtDesc(@Param("now") Instant now);

  @EntityGraph(attributePaths = {"category", "tags", "topics", "series", "series.primaryTopic"})
  Optional<Post> findBySlugAndStatus(String slug, PostStatus status);

  @EntityGraph(attributePaths = {"category", "tags", "topics", "series", "series.primaryTopic"})
  @Query("""
      select p from Post p
      where p.slug = :slug
        and p.visibility = com.example.blog.post.PostVisibility.PUBLIC
        and p.contentType = com.example.blog.post.PostContentType.ARTICLE
        and (p.status = com.example.blog.post.PostStatus.PUBLISHED
          or (p.status = com.example.blog.post.PostStatus.SCHEDULED and p.publishedAt <= :now))
      """)
  Optional<Post> findVisibleBySlug(@Param("slug") String slug, @Param("now") Instant now);

  List<Post> findTop20ByStatusOrderByPublishedAtDescCreatedAtDesc(PostStatus status);
  boolean existsBySlug(String slug);

  @Query("""
      select p from Post p
      where p.visibility = com.example.blog.post.PostVisibility.PUBLIC
        and p.contentType = com.example.blog.post.PostContentType.ARTICLE
        and (p.status = com.example.blog.post.PostStatus.PUBLISHED
         or (p.status = com.example.blog.post.PostStatus.SCHEDULED and p.publishedAt <= :now))
      order by p.publishedAt desc, p.createdAt desc
      """)
  List<Post> findVisibleForFeed(@Param("now") Instant now, Pageable pageable);

  @EntityGraph(attributePaths = {"category", "tags", "topics", "series", "series.primaryTopic"})
  List<Post> findByTopicsSlugAndStatusOrderByPublishedAtDescCreatedAtDesc(String slug, PostStatus status);

  @EntityGraph(attributePaths = {"category", "tags", "topics", "series", "series.primaryTopic"})
  @Query("""
      select distinct p from Post p join p.topics t
      where t.slug = :slug
        and p.visibility = com.example.blog.post.PostVisibility.PUBLIC
        and p.contentType = com.example.blog.post.PostContentType.ARTICLE
        and (p.status = com.example.blog.post.PostStatus.PUBLISHED
          or (p.status = com.example.blog.post.PostStatus.SCHEDULED and p.publishedAt <= :now))
      order by p.publishedAt desc, p.createdAt desc
      """)
  List<Post> findVisibleByTopicsSlugOrderByPublishedAtDescCreatedAtDesc(
      @Param("slug") String slug,
      @Param("now") Instant now);

  @EntityGraph(attributePaths = {"category", "tags", "topics", "series", "series.primaryTopic"})
  List<Post> findBySeriesSlugAndStatusOrderBySeriesOrderAsc(String slug, PostStatus status);

  @EntityGraph(attributePaths = {"category", "tags", "topics", "series", "series.primaryTopic"})
  @Query("""
      select p from Post p join p.series s
      where s.slug = :slug
        and p.visibility = com.example.blog.post.PostVisibility.PUBLIC
        and p.contentType = com.example.blog.post.PostContentType.ARTICLE
        and (p.status = com.example.blog.post.PostStatus.PUBLISHED
          or (p.status = com.example.blog.post.PostStatus.SCHEDULED and p.publishedAt <= :now))
      order by p.seriesOrder asc
      """)
  List<Post> findVisibleBySeriesSlugOrderBySeriesOrderAsc(@Param("slug") String slug, @Param("now") Instant now);

  boolean existsBySeriesId(Long seriesId);

  Optional<Post> findFirstBySeriesIdAndStatusAndSeriesOrderLessThanOrderBySeriesOrderDesc(
      Long seriesId, PostStatus status, Integer seriesOrder);

  Optional<Post> findFirstBySeriesIdAndStatusAndSeriesOrderGreaterThanOrderBySeriesOrderAsc(
      Long seriesId, PostStatus status, Integer seriesOrder);

  @Query("""
      select p from Post p
      where p.series.id = :seriesId
        and p.seriesOrder < :seriesOrder
        and p.visibility = com.example.blog.post.PostVisibility.PUBLIC
        and p.contentType = com.example.blog.post.PostContentType.ARTICLE
        and (p.status = com.example.blog.post.PostStatus.PUBLISHED
          or (p.status = com.example.blog.post.PostStatus.SCHEDULED and p.publishedAt <= :now))
      order by p.seriesOrder desc
      """)
  List<Post> findPreviousVisibleSeriesPosts(
      @Param("seriesId") Long seriesId,
      @Param("seriesOrder") Integer seriesOrder,
      @Param("now") Instant now,
      Pageable pageable);

  @Query("""
      select p from Post p
      where p.series.id = :seriesId
        and p.seriesOrder > :seriesOrder
        and p.visibility = com.example.blog.post.PostVisibility.PUBLIC
        and p.contentType = com.example.blog.post.PostContentType.ARTICLE
        and (p.status = com.example.blog.post.PostStatus.PUBLISHED
          or (p.status = com.example.blog.post.PostStatus.SCHEDULED and p.publishedAt <= :now))
      order by p.seriesOrder asc
      """)
  List<Post> findNextVisibleSeriesPosts(
      @Param("seriesId") Long seriesId,
      @Param("seriesOrder") Integer seriesOrder,
      @Param("now") Instant now,
      Pageable pageable);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("""
      update Post p set p.likeCount = p.likeCount + 1
      where p.slug = :slug
        and p.visibility = com.example.blog.post.PostVisibility.PUBLIC
        and p.contentType = com.example.blog.post.PostContentType.ARTICLE
        and (p.status = com.example.blog.post.PostStatus.PUBLISHED
          or (p.status = com.example.blog.post.PostStatus.SCHEDULED and p.publishedAt <= :now))
      """)
  int incrementVisibleLikeCount(@Param("slug") String slug, @Param("now") Instant now);

  @Query("""
      select p.likeCount from Post p
      where p.slug = :slug
        and p.visibility = com.example.blog.post.PostVisibility.PUBLIC
        and p.contentType = com.example.blog.post.PostContentType.ARTICLE
        and (p.status = com.example.blog.post.PostStatus.PUBLISHED
          or (p.status = com.example.blog.post.PostStatus.SCHEDULED and p.publishedAt <= :now))
      """)
  Optional<Long> findVisibleLikeCountBySlug(@Param("slug") String slug, @Param("now") Instant now);

  List<Post> findByCoverMediaIdOrderByTitleAsc(Long coverMediaId);

  List<Post> findByContentHtmlContainingOrderByTitleAsc(String value);

  @EntityGraph(attributePaths = {"category", "tags", "topics", "series", "series.primaryTopic"})
  @Query("select p from Post p order by p.createdAt desc")
  List<Post> findAllForAdmin();
}
