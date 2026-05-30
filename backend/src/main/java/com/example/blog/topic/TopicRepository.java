package com.example.blog.topic;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TopicRepository extends JpaRepository<Topic, Long> {
  List<Topic> findAllByOrderBySortOrderAscNameAsc();

  Optional<Topic> findBySlug(String slug);
}
