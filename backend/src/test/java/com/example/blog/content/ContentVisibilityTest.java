package com.example.blog.content;

import com.example.blog.TestApplicationProperties;
import com.example.blog.category.Category;
import com.example.blog.category.CategoryRepository;
import com.example.blog.post.Post;
import com.example.blog.post.PostRepository;
import com.example.blog.post.PostStatus;
import com.example.blog.tag.Tag;
import com.example.blog.tag.TagRepository;
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

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestApplicationProperties.class)
class ContentVisibilityTest {

  @Autowired
  MockMvc mvc;
  @Autowired
  PostRepository posts;
  @Autowired
  CategoryRepository categories;
  @Autowired
  TagRepository tags;

  @BeforeEach
  void setUp() {
    posts.deleteAll();
    tags.deleteAll();
    categories.deleteAll();
  }

  @Test
  void publicEndpointsOnlyReturnPublishedPostsWhileAdminReturnsDrafts() throws Exception {
    Category essays = categories.save(new Category("Essays", "essays", "Long form", 1));
    Tag craft = tags.save(new Tag("Craft", "craft"));
    Post draft = new Post("Draft", "draft-post", "Hidden", "<p>Draft</p>", PostStatus.DRAFT);
    draft.setCategory(essays);
    draft.setTags(Set.of(craft));
    posts.save(draft);

    Post published = new Post("Published", "published-post", "Visible", "<p>Published</p>", PostStatus.PUBLISHED);
    published.setCategory(essays);
    published.setTags(Set.of(craft));
    published.setPublishedAt(Instant.parse("2026-05-17T01:00:00Z"));
    posts.save(published);

    mvc.perform(get("/api/v1/posts"))
        .andExpect(status().isOk())
        .andExpect(content().string(containsString("Published")))
        .andExpect(content().string(not(containsString("Draft"))));

    mvc.perform(get("/api/v1/posts/draft-post"))
        .andExpect(status().isNotFound());

    String token = login();
    mvc.perform(get("/api/v1/admin/posts")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(content().string(containsString("Published")))
        .andExpect(content().string(containsString("Draft")));
  }

  @Test
  void creatingPublishedPostSanitizesHtmlAndAppearsInArchive() throws Exception {
    String token = login();
    Category category = categories.save(new Category("Notes", "notes", "", 0));

    mvc.perform(post("/api/v1/admin/posts")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "title": "Safe post",
                  "slug": "safe-post",
                  "summary": "Clean",
                  "contentHtml": "<h2 onclick='bad()'>Hi</h2><script>alert(1)</script><a href='javascript:bad()'>bad</a>",
                  "status": "PUBLISHED",
                  "categoryId": %d,
                  "tagIds": []
                }
                """.formatted(category.getId())))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.contentHtml").value(not(containsString("script"))))
        .andExpect(jsonPath("$.contentHtml").value(not(containsString("onclick"))))
        .andExpect(jsonPath("$.contentHtml").value(not(containsString("javascript"))));

    mvc.perform(get("/api/v1/archive"))
        .andExpect(status().isOk())
        .andExpect(content().string(containsString("Safe post")));
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
