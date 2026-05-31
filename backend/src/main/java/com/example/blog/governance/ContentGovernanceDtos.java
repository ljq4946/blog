package com.example.blog.governance;

import java.time.Instant;
import java.util.List;

public final class ContentGovernanceDtos {

  private ContentGovernanceDtos() {
  }

  public record ContentGovernanceResponse(
      GovernanceMetrics metrics,
      List<PostIssue> postIssues,
      List<TopicCoverage> topicCoverage,
      List<SeriesCoverage> seriesCoverage) {
  }

  public record GovernanceMetrics(
      long totalPosts,
      long published,
      long drafts,
      long scheduled,
      long missingSummary,
      long missingCover,
      long missingTopic,
      long emptyTopics,
      long seriesWithIssues) {
  }

  public record PostIssue(
      Long id,
      String title,
      String slug,
      String status,
      List<String> issues,
      Instant updatedAt) {
  }

  public record TopicCoverage(
      Long id,
      String name,
      String slug,
      int postCount,
      Instant latestPostUpdatedAt,
      boolean empty) {
  }

  public record SeriesCoverage(
      Long id,
      String name,
      String slug,
      int postCount,
      Instant latestPostUpdatedAt,
      boolean empty,
      boolean orderConflict,
      List<Integer> missingOrders) {
  }
}
