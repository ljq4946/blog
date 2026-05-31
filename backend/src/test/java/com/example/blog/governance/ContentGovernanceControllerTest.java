package com.example.blog.governance;

import com.example.blog.TestApplicationProperties;
import com.example.blog.post.Post;
import com.example.blog.post.PostRepository;
import com.example.blog.post.PostStatus;
import com.example.blog.series.Series;
import com.example.blog.series.SeriesRepository;
import com.example.blog.topic.Topic;
import com.example.blog.topic.TopicRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Set;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestApplicationProperties.class)
class ContentGovernanceControllerTest {

  @Autowired
  MockMvc mvc;
  @Autowired
  PostRepository posts;
  @Autowired
  TopicRepository topics;
  @Autowired
  SeriesRepository series;

  private Topic spring;
  private Topic emptyTopic;
  private Series blogSeries;

  @BeforeEach
  void setUp() {
    posts.deleteAll();
    series.deleteAll();
    topics.deleteAll();

    spring = topics.save(new Topic("Spring Boot", "spring-boot", "Backend notes", 0));
    emptyTopic = topics.save(new Topic("No Posts", "no-posts", "Needs content", 1));
    blogSeries = series.save(new Series("Build Blog", "build-blog", "Project series", spring, 0));

    Post complete = new Post("Complete Post", "complete-post", "Ready", "<p>Ready</p>", PostStatus.PUBLISHED);
    complete.setPublishedAt(Instant.parse("2026-05-01T00:00:00Z"));
    complete.setCoverMediaId(10L);
    complete.setTopics(Set.of(spring));
    complete.setSeries(blogSeries);
    complete.setSeriesOrder(1);
    posts.save(complete);

    Post draft = new Post("Needs Work", "needs-work", "", "<p>Draft</p>", PostStatus.DRAFT);
    posts.save(draft);

    Post scheduled = new Post("Future Chapter", "future-chapter", "Scheduled", "<p>Future</p>", PostStatus.SCHEDULED);
    scheduled.setPublishedAt(Instant.parse("2999-01-01T00:00:00Z"));
    scheduled.setTopics(Set.of(spring));
    scheduled.setSeries(blogSeries);
    scheduled.setSeriesOrder(3);
    posts.save(scheduled);

  }

  @Test
  void adminGovernanceSnapshotReportsContentGapsTopicCoverageAndSeriesIssues() throws Exception {
    String token = login();

    mvc.perform(get("/api/v1/admin/content-governance")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.metrics.totalPosts").value(3))
        .andExpect(jsonPath("$.metrics.published").value(1))
        .andExpect(jsonPath("$.metrics.drafts").value(1))
        .andExpect(jsonPath("$.metrics.scheduled").value(1))
        .andExpect(jsonPath("$.metrics.missingSummary").value(1))
        .andExpect(jsonPath("$.metrics.missingCover").value(2))
        .andExpect(jsonPath("$.metrics.missingTopic").value(1))
        .andExpect(jsonPath("$.metrics.emptyTopics").value(1))
        .andExpect(jsonPath("$.metrics.seriesWithIssues").value(1))
        .andExpect(jsonPath("$.postIssues[?(@.slug == 'needs-work')].issues[0]", hasItem("MISSING_SUMMARY")))
        .andExpect(jsonPath("$.postIssues[?(@.slug == 'needs-work')].issues[1]", hasItem("MISSING_COVER")))
        .andExpect(jsonPath("$.postIssues[?(@.slug == 'needs-work')].issues[2]", hasItem("MISSING_TOPIC")))
        .andExpect(jsonPath("$.topicCoverage[?(@.slug == 'spring-boot')].postCount", hasItem(2)))
        .andExpect(jsonPath("$.topicCoverage[?(@.slug == 'spring-boot')].latestPostUpdatedAt", hasItem(notNullValue())))
        .andExpect(jsonPath("$.topicCoverage[?(@.slug == 'no-posts')].empty", hasItem(true)))
        .andExpect(jsonPath("$.seriesCoverage[?(@.slug == 'build-blog')].postCount", hasItem(2)))
        .andExpect(jsonPath("$.seriesCoverage[?(@.slug == 'build-blog')].orderConflict", hasItem(false)))
        .andExpect(jsonPath("$.seriesCoverage[?(@.slug == 'build-blog')].missingOrders[0]", hasItem(2)));
  }

  @Test
  void adminGovernanceSnapshotRequiresAuthentication() throws Exception {
    mvc.perform(get("/api/v1/admin/content-governance"))
        .andExpect(status().isUnauthorized());
  }

  private String login() throws Exception {
    return mvc.perform(post("/api/v1/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"username\":\"4946\",\"password\":\"541312\"}"))
        .andReturn()
        .getResponse()
        .getContentAsString()
        .replaceAll("^.*\"token\"\\s*:\\s*\"([^\"]+)\".*$", "$1");
  }
}
