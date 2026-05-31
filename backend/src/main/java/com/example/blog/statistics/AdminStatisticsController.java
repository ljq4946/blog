package com.example.blog.statistics;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import static com.example.blog.statistics.AdminStatisticsDtos.AdminStatisticsResponse;

@RestController
public class AdminStatisticsController {

  private final AdminStatisticsService statistics;

  public AdminStatisticsController(AdminStatisticsService statistics) {
    this.statistics = statistics;
  }

  @GetMapping("/api/v1/admin/statistics")
  public AdminStatisticsResponse snapshot() {
    return statistics.snapshot();
  }
}
