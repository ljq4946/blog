package com.example.blog.series;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SeriesRepository extends JpaRepository<Series, Long> {

  @EntityGraph(attributePaths = {"primaryTopic"})
  List<Series> findAllByOrderBySortOrderAscNameAsc();

  @EntityGraph(attributePaths = {"primaryTopic"})
  Optional<Series> findBySlug(String slug);

  @EntityGraph(attributePaths = {"primaryTopic"})
  List<Series> findByPrimaryTopicSlugOrderBySortOrderAscNameAsc(String slug);
}
