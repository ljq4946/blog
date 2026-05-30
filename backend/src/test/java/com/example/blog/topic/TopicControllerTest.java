package com.example.blog.topic;

import com.example.blog.TestApplicationProperties;
import com.example.blog.post.Post;
import com.example.blog.post.PostRepository;
import com.example.blog.post.PostStatus;
import com.example.blog.series.Series;
import com.example.blog.series.SeriesRepository;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestApplicationProperties.class)
class TopicControllerTest {

  @Autowired
  MockMvc mvc;
  @Autowired
  TopicRepository topics;
  @Autowired
  SeriesRepository series;
  @Autowired
  PostRepository posts;

  @BeforeEach
  void setUp() {
    posts.deleteAll();
    series.deleteAll();
    topics.deleteAll();
  }

  @Test
  void publicListReturnsTopicsOrderedBySortAndName() throws Exception {
    topics.save(new Topic("Vue 3", "vue-3", "Frontend topic", 2));
    topics.save(new Topic("Spring Boot", "spring-boot", "Backend topic", 1));

    mvc.perform(get("/api/v1/topics"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].slug").value("spring-boot"))
        .andExpect(jsonPath("$[1].slug").value("vue-3"));
  }

  @Test
  void publicDetailReturnsTopicRelatedSeriesAndPublishedPosts() throws Exception {
    Topic spring = topics.save(new Topic("Spring Boot", "spring-boot", "Backend topic", 1));
    series.save(new Series("Build Blog", "build-blog", "Project series", spring, 0));
    Post post = new Post("JWT Login", "jwt-login", "Auth summary", "<p>JWT</p>", PostStatus.PUBLISHED);
    post.setPublishedAt(Instant.parse("2026-05-20T00:00:00Z"));
    post.setTopics(Set.of(spring));
    posts.save(post);

    mvc.perform(get("/api/v1/topics/spring-boot"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.topic.slug").value("spring-boot"))
        .andExpect(jsonPath("$.relatedSeries[0].slug").value("build-blog"))
        .andExpect(jsonPath("$.posts[0].slug").value("jwt-login"));
  }

  @Test
  void adminCanCreateUpdateAndDeleteTopic() throws Exception {
    String token = login();

    mvc.perform(post("/api/v1/admin/topics")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"name":"Security","slug":"security","description":"Auth notes","sortOrder":3}
                """))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.slug").value("security"));

    Long id = topics.findBySlug("security").orElseThrow().getId();

    mvc.perform(put("/api/v1/admin/topics/" + id)
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"name":"Authentication","slug":"auth","description":"Security notes","sortOrder":4}
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.slug").value("auth"));

    mvc.perform(delete("/api/v1/admin/topics/" + id)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isNoContent());
  }

  @Test
  void adminCreateRequiresAuthentication() throws Exception {
    mvc.perform(post("/api/v1/admin/topics")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{}"))
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
