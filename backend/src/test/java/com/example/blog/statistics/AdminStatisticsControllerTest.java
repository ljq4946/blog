package com.example.blog.statistics;

import com.example.blog.TestApplicationProperties;
import com.example.blog.interaction.CommentStatus;
import com.example.blog.interaction.PostComment;
import com.example.blog.interaction.PostCommentRepository;
import com.example.blog.post.Post;
import com.example.blog.post.PostRepository;
import com.example.blog.post.PostStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestApplicationProperties.class)
class AdminStatisticsControllerTest {

  @Autowired
  MockMvc mvc;
  @Autowired
  PostRepository posts;
  @Autowired
  PostCommentRepository comments;

  @BeforeEach
  void setUp() {
    comments.deleteAll();
    posts.deleteAll();
  }

  @Test
  void adminStatisticsSnapshotReportsViewsLikesCommentsAndPopularPosts() throws Exception {
    Post popular = published("Popular One", "popular-one");
    published("Quiet Post", "quiet-post");

    mvc.perform(get("/api/v1/posts/popular-one")).andExpect(status().isOk());
    mvc.perform(get("/api/v1/posts/popular-one")).andExpect(status().isOk());
    mvc.perform(get("/api/v1/posts/quiet-post")).andExpect(status().isOk());
    mvc.perform(post("/api/v1/posts/popular-one/likes")).andExpect(status().isOk());
    mvc.perform(post("/api/v1/posts/popular-one/likes")).andExpect(status().isOk());

    PostComment pending = comments.save(new PostComment(popular, "Reader A", "a@example.com", "Pending comment"));
    PostComment approved = new PostComment(popular, "Reader B", "b@example.com", "Approved comment");
    approved.setStatus(CommentStatus.APPROVED);
    comments.save(approved);

    String token = login();
    mvc.perform(get("/api/v1/admin/statistics")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.metrics.totalViews").value(3))
        .andExpect(jsonPath("$.metrics.totalLikes").value(2))
        .andExpect(jsonPath("$.metrics.totalComments").value(2))
        .andExpect(jsonPath("$.metrics.pendingComments").value(1))
        .andExpect(jsonPath("$.metrics.approvedComments").value(1))
        .andExpect(jsonPath("$.metrics.rejectedComments").value(0))
        .andExpect(jsonPath("$.popularPosts[0].slug").value("popular-one"))
        .andExpect(jsonPath("$.popularPosts[0].viewCount").value(2))
        .andExpect(jsonPath("$.popularPosts[0].likeCount").value(2))
        .andExpect(jsonPath("$.popularPosts[0].commentCount").value(2))
        .andExpect(jsonPath("$.popularPosts[*].slug", hasItem("quiet-post")));
  }

  @Test
  void adminStatisticsRequiresAuthentication() throws Exception {
    mvc.perform(get("/api/v1/admin/statistics"))
        .andExpect(status().isUnauthorized());
  }

  private Post published(String title, String slug) {
    Post post = new Post(title, slug, "Summary", "<p>Body</p>", PostStatus.PUBLISHED);
    post.setPublishedAt(Instant.parse("2026-05-01T00:00:00Z"));
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
