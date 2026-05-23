package com.example.blog.interaction;

import com.example.blog.post.PostStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PostCommentRepository extends JpaRepository<PostComment, Long> {

  @EntityGraph(attributePaths = "post")
  List<PostComment> findByPostSlugAndPostStatusOrderByCreatedAtAsc(String slug, PostStatus status);

  @EntityGraph(attributePaths = "post")
  @Query("select c from PostComment c order by c.createdAt desc")
  List<PostComment> findAllForAdmin();
}
