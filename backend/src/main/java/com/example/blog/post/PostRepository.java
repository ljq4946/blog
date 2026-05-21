package com.example.blog.post;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long>, JpaSpecificationExecutor<Post> {

  @EntityGraph(attributePaths = {"category", "tags"})
  List<Post> findByStatusOrderByPublishedAtDescCreatedAtDesc(PostStatus status);

  @EntityGraph(attributePaths = {"category", "tags"})
  Optional<Post> findBySlugAndStatus(String slug, PostStatus status);

  @EntityGraph(attributePaths = {"category", "tags"})
  @Query("select p from Post p order by p.createdAt desc")
  List<Post> findAllForAdmin();
}
