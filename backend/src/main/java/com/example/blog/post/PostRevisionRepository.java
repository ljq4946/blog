package com.example.blog.post;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRevisionRepository extends JpaRepository<PostRevision, Long> {

  @EntityGraph(attributePaths = "post")
  List<PostRevision> findByPostIdOrderByCreatedAtDesc(Long postId);
}
