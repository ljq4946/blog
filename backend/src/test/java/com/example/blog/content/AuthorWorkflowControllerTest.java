package com.example.blog.content;

import com.example.blog.TestApplicationProperties;
import com.example.blog.category.Category;
import com.example.blog.category.CategoryRepository;
import com.example.blog.post.Post;
import com.example.blog.post.PostRepository;
import com.example.blog.post.PostStatus;
import com.example.blog.tag.Tag;
import com.example.blog.tag.TagRepository;
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

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestApplicationProperties.class)
class AuthorWorkflowControllerTest {

  @Autowired
  MockMvc mvc;
  @Autowired
  PostRepository posts;
  @Autowired
  CategoryRepository categories;
  @Autowired
  TagRepository tags;
  @Autowired
  TopicRepository topics;

  @BeforeEach
  void setUp() {
    posts.deleteAll();
    topics.deleteAll();
    tags.deleteAll();
    categories.deleteAll();
  }

  @Test
  void scheduledPostsStayPrivateUntilPublishedAtAndCarrySeoMetadata() throws Exception {
    String token = login();

    mvc.perform(post("/api/v1/admin/posts")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "title": "Future Draft",
                  "slug": "future-draft",
                  "summary": "Hidden until later",
                  "contentHtml": "<p>Future body</p>",
                  "status": "SCHEDULED",
                  "publishedAt": "2999-01-01T00:00:00Z",
                  "seoTitle": "Future SEO",
                  "seoDescription": "Future search description",
                  "topicIds": [],
                  "tagIds": []
                }
                """))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.status").value("SCHEDULED"))
        .andExpect(jsonPath("$.seoTitle").value("Future SEO"))
        .andExpect(jsonPath("$.seoDescription").value("Future search description"));

    mvc.perform(post("/api/v1/admin/posts")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "title": "Due Scheduled",
                  "slug": "due-scheduled",
                  "summary": "Visible now",
                  "contentHtml": "<p>Due body</p>",
                  "status": "SCHEDULED",
                  "publishedAt": "2000-01-01T00:00:00Z",
                  "seoTitle": "Due SEO",
                  "seoDescription": "Due search description",
                  "topicIds": [],
                  "tagIds": []
                }
                """))
        .andExpect(status().isCreated());

    mvc.perform(get("/api/v1/posts"))
        .andExpect(status().isOk())
        .andExpect(content().string(containsString("Due Scheduled")))
        .andExpect(content().string(not(containsString("Future Draft"))));

    mvc.perform(get("/api/v1/posts/future-draft"))
        .andExpect(status().isNotFound());

    mvc.perform(get("/api/v1/posts/due-scheduled"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.seoTitle").value("Due SEO"))
        .andExpect(jsonPath("$.seoDescription").value("Due search description"));
  }

  @Test
  void updatingPostCreatesRevisionAndCanRestoreSnapshot() throws Exception {
    String token = login();
    String createResponse = mvc.perform(post("/api/v1/admin/posts")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "title": "Original Title",
                  "slug": "original-title",
                  "summary": "Original summary",
                  "contentHtml": "<p>Original body</p>",
                  "status": "DRAFT",
                  "seoTitle": "Original SEO",
                  "seoDescription": "Original SEO description",
                  "topicIds": [],
                  "tagIds": []
                }
                """))
        .andExpect(status().isCreated())
        .andReturn()
        .getResponse()
        .getContentAsString();

    Long postId = idFrom(createResponse);

    mvc.perform(put("/api/v1/admin/posts/" + postId)
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "title": "Updated Title",
                  "slug": "updated-title",
                  "summary": "Updated summary",
                  "contentHtml": "<p>Updated body</p>",
                  "status": "DRAFT",
                  "seoTitle": "Updated SEO",
                  "seoDescription": "Updated SEO description",
                  "topicIds": [],
                  "tagIds": []
                }
                """))
        .andExpect(status().isOk());

    String revisionsResponse = mvc.perform(get("/api/v1/admin/posts/" + postId + "/revisions")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].title").value("Original Title"))
        .andExpect(jsonPath("$[0].seoTitle").value("Original SEO"))
        .andReturn()
        .getResponse()
        .getContentAsString();

    Long revisionId = idFrom(revisionsResponse);
    mvc.perform(post("/api/v1/admin/posts/" + postId + "/revisions/" + revisionId + "/restore")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.title").value("Original Title"))
        .andExpect(jsonPath("$.contentHtml").value("<p>Original body</p>"))
        .andExpect(jsonPath("$.seoTitle").value("Original SEO"));
  }

  @Test
  void publicPostDetailReturnsRelatedPostsAndIncrementsViews() throws Exception {
    Category category = categories.save(new Category("Engineering", "engineering", "", 0));
    Tag java = tags.save(new Tag("Java", "java"));
    Topic spring = topics.save(new Topic("Spring", "spring", "Spring topic", 0));

    Post current = published("Spring Deep Dive", "spring-deep-dive", category, Set.of(java), Set.of(spring));
    published("Related Spring", "related-spring", category, Set.of(java), Set.of(spring));
    published("Other", "other", null, Set.of(), Set.of());

    mvc.perform(get("/api/v1/posts/" + current.getSlug()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.viewCount").value(1))
        .andExpect(jsonPath("$.relatedPosts[0].slug").value("related-spring"))
        .andExpect(content().string(not(containsString("\"slug\":\"other\""))));

    mvc.perform(get("/api/v1/posts/" + current.getSlug()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.viewCount").value(2));
  }

  private Post published(String title, String slug, Category category, Set<Tag> selectedTags, Set<Topic> selectedTopics) {
    Post post = new Post(title, slug, "Summary", "<p>Body</p>", PostStatus.PUBLISHED);
    post.setCategory(category);
    post.setTags(selectedTags);
    post.setTopics(selectedTopics);
    post.setPublishedAt(Instant.parse("2026-05-01T00:00:00Z"));
    return posts.save(post);
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
