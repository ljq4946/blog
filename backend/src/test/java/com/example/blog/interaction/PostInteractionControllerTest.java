package com.example.blog.interaction;

import com.example.blog.TestApplicationProperties;
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

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestApplicationProperties.class)
class PostInteractionControllerTest {

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

    Post published = new Post("Public Post", "public-post", "Visible", "<p>Body</p>", PostStatus.PUBLISHED);
    published.setPublishedAt(Instant.parse("2026-05-20T00:00:00Z"));
    posts.save(published);

    posts.save(new Post("Draft Post", "draft-post", "Hidden", "<p>Body</p>", PostStatus.DRAFT));
  }

  @Test
  void publicCommentRequiresPublishedPostAndStaysHiddenUntilApproved() throws Exception {
    mvc.perform(post("/api/v1/posts/public-post/comments")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "nickname": "Reader",
                  "email": "reader@example.com",
                  "content": "<b>Hello</b> from comments"
                }
                """))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.nickname").value("Reader"))
        .andExpect(jsonPath("$.content").value("<b>Hello</b> from comments"))
        .andExpect(jsonPath("$.status").value("PENDING"))
        .andExpect(content().string(not(containsString("reader@example.com"))));

    mvc.perform(get("/api/v1/posts/public-post/comments"))
        .andExpect(status().isOk())
        .andExpect(content().json("[]"));

    String token = login();
    String adminResponse = mvc.perform(get("/api/v1/admin/comments")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].status").value("PENDING"))
        .andReturn()
        .getResponse()
        .getContentAsString();

    Long commentId = Long.valueOf(adminResponse.replaceAll("^.*\"id\"\\s*:\\s*(\\d+).*$", "$1"));
    mvc.perform(put("/api/v1/admin/comments/" + commentId + "/status")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"status\":\"APPROVED\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("APPROVED"));

    mvc.perform(get("/api/v1/posts/public-post/comments"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].nickname").value("Reader"))
        .andExpect(jsonPath("$[0].content").value("<b>Hello</b> from comments"))
        .andExpect(content().string(not(containsString("reader@example.com"))));

    mvc.perform(post("/api/v1/posts/draft-post/comments")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"nickname\":\"Reader\",\"content\":\"Hidden\"}"))
        .andExpect(status().isNotFound());
  }

  @Test
  void publicCommentValidatesRequiredFieldsAndLength() throws Exception {
    mvc.perform(post("/api/v1/posts/public-post/comments")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"nickname\":\" \",\"content\":\"Hello\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("nickname is required"));

    mvc.perform(post("/api/v1/posts/public-post/comments")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"nickname\":\"Reader\",\"content\":\"%s\"}".formatted("x".repeat(1001))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("content must be at most 1000 characters"));
  }

  @Test
  void adminCanListEmailAndDeleteComments() throws Exception {
    mvc.perform(post("/api/v1/posts/public-post/comments")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"nickname\":\"Reader\",\"email\":\"reader@example.com\",\"content\":\"Please keep this\"}"))
        .andExpect(status().isCreated());

    String token = login();
    String adminResponse = mvc.perform(get("/api/v1/admin/comments")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].postTitle").value("Public Post"))
        .andExpect(jsonPath("$[0].status").value("PENDING"))
        .andExpect(jsonPath("$[0].email").value("reader@example.com"))
        .andReturn()
        .getResponse()
        .getContentAsString();

    Long commentId = Long.valueOf(adminResponse.replaceAll("^.*\"id\"\\s*:\\s*(\\d+).*$", "$1"));
    mvc.perform(delete("/api/v1/admin/comments/" + commentId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isNoContent());

    mvc.perform(get("/api/v1/posts/public-post/comments"))
        .andExpect(status().isOk())
        .andExpect(content().json("[]"));
  }

  @Test
  void likesArePersistedPerPostAndOnlyPublishedPostsCanBeLiked() throws Exception {
    mvc.perform(get("/api/v1/posts/public-post/likes"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.count").value(0));

    mvc.perform(post("/api/v1/posts/public-post/likes"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.count").value(1));

    mvc.perform(post("/api/v1/posts/public-post/likes"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.count").value(2));

    mvc.perform(get("/api/v1/posts/public-post/likes"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.count").value(2));

    mvc.perform(post("/api/v1/posts/draft-post/likes"))
        .andExpect(status().isNotFound());
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
