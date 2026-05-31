package com.example.blog.knowledge;

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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestApplicationProperties.class)
class KnowledgeSystemControllerTest {

  @Autowired
  MockMvc mvc;
  @Autowired
  PostRepository posts;

  @BeforeEach
  void setUp() {
    posts.deleteAll();
  }

  @Test
  void privateNotesStayOutOfPublicSurfacesButRemainVisibleInAdminFilters() throws Exception {
    String token = login();
    Long noteId = createPost(token, """
        {
          "title": "Raw Private Idea",
          "slug": "raw-private-idea",
          "summary": "Private notebook summary",
          "contentHtml": "<p>zettelkasten private body</p>",
          "status": "DRAFT",
          "visibility": "PRIVATE",
          "contentType": "NOTE",
          "topicIds": [],
          "tagIds": []
        }
        """);
    createPost(token, """
        {
          "title": "Public Article",
          "slug": "public-article",
          "summary": "Visible",
          "contentHtml": "<p>public body</p>",
          "status": "PUBLISHED",
          "visibility": "PUBLIC",
          "contentType": "ARTICLE",
          "publishedAt": "2026-05-01T00:00:00Z",
          "topicIds": [],
          "tagIds": []
        }
        """);

    mvc.perform(get("/api/v1/posts"))
        .andExpect(status().isOk())
        .andExpect(content().string(containsString("Public Article")))
        .andExpect(content().string(not(containsString("Raw Private Idea"))));
    mvc.perform(get("/api/v1/posts/raw-private-idea")).andExpect(status().isNotFound());
    mvc.perform(get("/api/v1/archive"))
        .andExpect(status().isOk())
        .andExpect(content().string(not(containsString("Raw Private Idea"))));
    mvc.perform(get("/feed.xml"))
        .andExpect(status().isOk())
        .andExpect(content().string(not(containsString("Raw Private Idea"))));
    mvc.perform(get("/sitemap.xml"))
        .andExpect(status().isOk())
        .andExpect(content().string(not(containsString("raw-private-idea"))));

    mvc.perform(get("/api/v1/admin/posts")
            .header("Authorization", "Bearer " + token)
            .param("visibility", "PRIVATE")
            .param("contentType", "NOTE"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value(noteId))
        .andExpect(jsonPath("$[0].visibility").value("PRIVATE"))
        .andExpect(jsonPath("$[0].contentType").value("NOTE"))
        .andExpect(content().string(not(containsString("Public Article"))));
  }

  @Test
  void adminCanSearchRelateConvertAndExportKnowledgeItems() throws Exception {
    String token = login();
    Long noteId = createPost(token, """
        {
          "title": "Inbox Research Note",
          "slug": "inbox-research-note",
          "summary": "Unpublished source material",
          "contentHtml": "<p>Durable zettelkasten evidence</p>",
          "status": "DRAFT",
          "visibility": "PRIVATE",
          "contentType": "NOTE",
          "topicIds": [],
          "tagIds": []
        }
        """);
    Long articleId = createPost(token, """
        {
          "title": "Published Learning",
          "slug": "published-learning",
          "summary": "Public article",
          "contentHtml": "<p>Public learning</p>",
          "status": "PUBLISHED",
          "visibility": "PUBLIC",
          "contentType": "ARTICLE",
          "publishedAt": "2026-05-02T00:00:00Z",
          "topicIds": [],
          "tagIds": []
        }
        """);

    mvc.perform(get("/api/v1/admin/knowledge-search")
            .header("Authorization", "Bearer " + token)
            .param("keyword", "zettelkasten"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[0].id").value(noteId))
        .andExpect(jsonPath("$.content[0].visibility").value("PRIVATE"))
        .andExpect(jsonPath("$.content[0].contentType").value("NOTE"));

    String relationResponse = mvc.perform(post("/api/v1/admin/knowledge-relations")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "sourcePostId": %d,
                  "targetPostId": %d,
                  "type": "SOURCE"
                }
                """.formatted(noteId, articleId)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.sourcePost.id").value(noteId))
        .andExpect(jsonPath("$.targetPost.id").value(articleId))
        .andExpect(jsonPath("$.type").value("SOURCE"))
        .andReturn()
        .getResponse()
        .getContentAsString();
    Long relationId = idFrom(relationResponse);

    mvc.perform(get("/api/v1/admin/knowledge-relations")
            .header("Authorization", "Bearer " + token)
            .param("postId", noteId.toString()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].targetPost.title").value("Published Learning"));

    mvc.perform(delete("/api/v1/admin/knowledge-relations/" + relationId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isNoContent());

    mvc.perform(post("/api/v1/admin/posts/" + noteId + "/convert-to-article")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.title").value("Inbox Research Note"))
        .andExpect(jsonPath("$.slug").value("inbox-research-note-article"))
        .andExpect(jsonPath("$.status").value("DRAFT"))
        .andExpect(jsonPath("$.visibility").value("PUBLIC"))
        .andExpect(jsonPath("$.contentType").value("ARTICLE"));

    mvc.perform(get("/api/v1/admin/export")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(header().string("Content-Disposition", containsString("blog-export.json")))
        .andExpect(jsonPath("$.posts[0].visibility").exists())
        .andExpect(content().string(containsString("Inbox Research Note")))
        .andExpect(content().string(containsString("Published Learning")));
  }

  private Long createPost(String token, String body) throws Exception {
    String response = mvc.perform(post("/api/v1/admin/posts")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isCreated())
        .andReturn()
        .getResponse()
        .getContentAsString();
    return idFrom(response);
  }

  private Long idFrom(String response) {
    return Long.valueOf(response.replaceAll("^.*\"id\"\\s*:\\s*(\\d+).*$", "$1"));
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
