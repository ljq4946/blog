package com.example.blog.statistics;

import java.time.Instant;
import java.util.List;

public final class AdminStatisticsDtos {

  private AdminStatisticsDtos() {
  }

  public record AdminStatisticsResponse(
      StatisticsMetrics metrics,
      List<PopularPost> popularPosts) {
  }

  public record StatisticsMetrics(
      long totalViews,
      long totalLikes,
      long totalComments,
      long pendingComments,
      long approvedComments,
      long rejectedComments) {
  }

  public record PopularPost(
      Long id,
      String title,
      String slug,
      long viewCount,
      long likeCount,
      long commentCount,
      Instant publishedAt) {
  }
}
