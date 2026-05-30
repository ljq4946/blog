package com.example.blog.content;

import com.example.blog.TestApplicationProperties;
import com.example.blog.post.PostRepository;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestApplicationProperties.class)
class PostContentStructureControllerTest {

  @Autowired
  MockMvc mvc;
  @Autowired
  PostRepository posts;
  @Autowired
  TopicRepository topics;
  @Autowired
  SeriesRepository series;

  Topic spring;
  Topic security;
  Series buildBlog;

  @BeforeEach
  void setUp() {
    posts.deleteAll();
    series.deleteAll();
    topics.deleteAll();
    spring = topics.save(new Topic("Spring Boot", "spring-boot", "Backend topic", 0));
    security = topics.save(new Topic("Security", "security", "Security topic", 1));
    buildBlog = series.save(new Series("Build Blog", "build-blog", "Project series", spring, 0));
  }

  @Test
  void adminCanCreatePostWithTopicsAndSeries() throws Exception {
    String token = login();

    mvc.perform(post("/api/v1/admin/posts")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "title": "JWT Login",
                  "slug": "jwt-login",
                  "summary": "Auth summary",
                  "contentHtml": "<p>JWT</p>",
                  "status": "PUBLISHED",
                  "topicIds": [%d, %d],
                  "seriesId": %d,
                  "seriesOrder": 1,
                  "tagIds": []
                }
                """.formatted(spring.getId(), security.getId(), buildBlog.getId())))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.topics.length()").value(2))
        .andExpect(jsonPath("$.series.slug").value("build-blog"))
        .andExpect(jsonPath("$.seriesOrder").value(1));

    mvc.perform(get("/api/v1/posts/jwt-login"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.topics.length()").value(2))
        .andExpect(jsonPath("$.series.slug").value("build-blog"));
  }

  @Test
  void seriesSelectionRequiresPositiveOrder() throws Exception {
    String token = login();

    mvc.perform(post("/api/v1/admin/posts")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "title": "JWT Login",
                  "slug": "jwt-login",
                  "contentHtml": "<p>JWT</p>",
                  "status": "PUBLISHED",
                  "topicIds": [],
                  "seriesId": %d,
                  "seriesOrder": null,
                  "tagIds": []
                }
                """.formatted(buildBlog.getId())))
        .andExpect(status().isBadRequest());
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
