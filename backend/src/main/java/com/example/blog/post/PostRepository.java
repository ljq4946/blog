package com.example.blog.post;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long>, JpaSpecificationExecutor<Post> {

  @EntityGraph(attributePaths = {"category", "tags", "topics", "series", "series.primaryTopic"})
  List<Post> findByStatusOrderByPublishedAtDescCreatedAtDesc(PostStatus status);

  @EntityGraph(attributePaths = {"category", "tags", "topics", "series", "series.primaryTopic"})
  Optional<Post> findBySlugAndStatus(String slug, PostStatus status);

  List<Post> findTop20ByStatusOrderByPublishedAtDescCreatedAtDesc(PostStatus status);

  @EntityGraph(attributePaths = {"category", "tags", "topics", "series", "series.primaryTopic"})
  List<Post> findByTopicsSlugAndStatusOrderByPublishedAtDescCreatedAtDesc(String slug, PostStatus status);

  @EntityGraph(attributePaths = {"category", "tags", "topics", "series", "series.primaryTopic"})
  List<Post> findBySeriesSlugAndStatusOrderBySeriesOrderAsc(String slug, PostStatus status);

  boolean existsBySeriesId(Long seriesId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("update Post p set p.likeCount = p.likeCount + 1 where p.slug = :slug and p.status = :status")
  int incrementLikeCount(@Param("slug") String slug, @Param("status") PostStatus status);

  @Query("select p.likeCount from Post p where p.slug = :slug and p.status = :status")
  Optional<Long> findLikeCountBySlugAndStatus(@Param("slug") String slug, @Param("status") PostStatus status);

  @EntityGraph(attributePaths = {"category", "tags", "topics", "series", "series.primaryTopic"})
  @Query("select p from Post p order by p.createdAt desc")
  List<Post> findAllForAdmin();
}
