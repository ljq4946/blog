package com.example.blog.knowledge;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface KnowledgeRelationRepository extends JpaRepository<KnowledgeRelation, Long> {

  @EntityGraph(attributePaths = {"sourcePost", "targetPost"})
  List<KnowledgeRelation> findAllByOrderByCreatedAtDesc();

  @EntityGraph(attributePaths = {"sourcePost", "targetPost"})
  @Query("""
      select relation from KnowledgeRelation relation
      where relation.sourcePost.id = :postId or relation.targetPost.id = :postId
      order by relation.createdAt desc
      """)
  List<KnowledgeRelation> findForPost(@Param("postId") Long postId);
}
