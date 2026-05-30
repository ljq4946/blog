package com.example.blog.series;

import com.example.blog.TestApplicationProperties;
import com.example.blog.post.Post;
import com.example.blog.post.PostRepository;
import com.example.blog.post.PostStatus;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestApplicationProperties.class)
class SeriesControllerTest {

  @Autowired
  MockMvc mvc;
  @Autowired
  SeriesRepository series;
  @Autowired
  TopicRepository topics;
  @Autowired
  PostRepository posts;

  @BeforeEach
  void setUp() {
    posts.deleteAll();
    series.deleteAll();
    topics.deleteAll();
  }

  @Test
  void publicDetailReturnsOrderedPublishedPosts() throws Exception {
    Topic spring = topics.save(new Topic("Spring Boot", "spring-boot", "Backend topic", 0));
    Series buildBlog = series.save(new Series("Build Blog", "build-blog", "Project series", spring, 0));
    published("Part Two", "part-two", buildBlog, 2);
    published("Part One", "part-one", buildBlog, 1);
    Post draft = new Post("Draft Part", "draft-part", "Hidden", "<p>Draft</p>", PostStatus.DRAFT);
    draft.setSeries(buildBlog);
    draft.setSeriesOrder(3);
    posts.save(draft);

    mvc.perform(get("/api/v1/series/build-blog"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.series.slug").value("build-blog"))
        .andExpect(jsonPath("$.series.primaryTopic.slug").value("spring-boot"))
        .andExpect(jsonPath("$.posts.length()").value(2))
        .andExpect(jsonPath("$.posts[0].slug").value("part-one"))
        .andExpect(jsonPath("$.posts[1].slug").value("part-two"));
  }

  @Test
  void adminCanCreateAndUpdateSeriesWithPrimaryTopic() throws Exception {
    String token = login();
    Topic spring = topics.save(new Topic("Spring Boot", "spring-boot", "Backend topic", 0));

    mvc.perform(post("/api/v1/admin/series")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"name":"Build Blog","slug":"build-blog","description":"Project series","primaryTopicId":%d,"sortOrder":1}
                """.formatted(spring.getId())))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.slug").value("build-blog"))
        .andExpect(jsonPath("$.primaryTopic.slug").value("spring-boot"));

    Long id = series.findBySlug("build-blog").orElseThrow().getId();

    mvc.perform(put("/api/v1/admin/series/" + id)
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"name":"Build Blog 1.2","slug":"build-blog-12","description":"Updated","primaryTopicId":null,"sortOrder":2}
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.slug").value("build-blog-12"))
        .andExpect(jsonPath("$.primaryTopic").doesNotExist());
  }

  @Test
  void deletingAttachedSeriesReturnsBadRequest() throws Exception {
    String token = login();
    Series buildBlog = series.save(new Series("Build Blog", "build-blog", "Project series", null, 0));
    published("Part One", "part-one", buildBlog, 1);

    mvc.perform(delete("/api/v1/admin/series/" + buildBlog.getId())
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isBadRequest());
  }

  private Post published(String title, String slug, Series series, int order) {
    Post post = new Post(title, slug, "Summary", "<p>Body</p>", PostStatus.PUBLISHED);
    post.setSeries(series);
    post.setSeriesOrder(order);
    post.setPublishedAt(Instant.parse("2026-05-%02dT00:00:00Z".formatted(order)));
    return posts.save(post);
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
