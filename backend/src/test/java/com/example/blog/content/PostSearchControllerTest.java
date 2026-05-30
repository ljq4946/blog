package com.example.blog.content;

import com.example.blog.TestApplicationProperties;
import com.example.blog.category.Category;
import com.example.blog.category.CategoryRepository;
import com.example.blog.post.Post;
import com.example.blog.post.PostRepository;
import com.example.blog.post.PostStatus;
import com.example.blog.series.Series;
import com.example.blog.series.SeriesRepository;
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
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Set;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestApplicationProperties.class)
class PostSearchControllerTest {

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
  @Autowired
  SeriesRepository series;

  Category engineering;
  Category notes;
  Tag vue;
  Tag java;
  Topic spring;
  Topic security;
  Series buildBlog;

  @BeforeEach
  void setUp() {
    posts.deleteAll();
    series.deleteAll();
    topics.deleteAll();
    tags.deleteAll();
    categories.deleteAll();

    engineering = categories.save(new Category("Engineering", "engineering", "", 0));
    notes = categories.save(new Category("Notes", "notes", "", 1));
    vue = tags.save(new Tag("Vue", "vue"));
    java = tags.save(new Tag("Java", "java"));
    spring = topics.save(new Topic("Spring Boot", "spring-boot", "Backend topic", 0));
    security = topics.save(new Topic("Security", "security", "Security topic", 1));
    buildBlog = series.save(new Series("Build Blog", "build-blog", "Project series", spring, 0));

    published("Vue Reading", "vue-reading", "Frontend summary", "<p>Composition API guide</p>",
        engineering, Set.of(vue), "2026-05-20T00:00:00Z");
    Post springPost = published("Spring Search", "spring-search", "Backend summary", "<p>Criteria query guide</p>",
        engineering, Set.of(java), "2025-04-10T00:00:00Z");
    springPost.setTopics(Set.of(spring, security));
    springPost.setSeries(buildBlog);
    springPost.setSeriesOrder(1);
    posts.save(springPost);
    published("Personal Note", "personal-note", "Notebook summary", "<p>Daily writing</p>",
        notes, Set.of(), "2026-01-02T00:00:00Z");

    Post draft = new Post("Draft Search", "draft-search", "Hidden", "<p>hidden keyword</p>", PostStatus.DRAFT);
    draft.setCategory(engineering);
    draft.setTags(Set.of(vue));
    posts.save(draft);
  }

  @Test
  void defaultSearchReturnsPagedPublishedPostsOnly() throws Exception {
    mvc.perform(get("/api/v1/posts/search"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content.length()").value(3))
        .andExpect(jsonPath("$.number").value(0))
        .andExpect(jsonPath("$.size").value(10))
        .andExpect(jsonPath("$.totalElements").value(3))
        .andExpect(jsonPath("$.totalPages").value(1))
        .andExpect(jsonPath("$.content[0].title").value("Vue Reading"))
        .andExpect(jsonPath("$.content[0].category.slug").value("engineering"))
        .andExpect(jsonPath("$.content[0].tags[0].slug").value("vue"))
        .andExpect(content().string(not(containsString("Draft Search"))));
  }

  @Test
  void keywordMatchesTitleSummaryAndContentHtml() throws Exception {
    mvc.perform(get("/api/v1/posts/search").param("keyword", "vue"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content.length()").value(1))
        .andExpect(jsonPath("$.content[0].title").value("Vue Reading"));

    mvc.perform(get("/api/v1/posts/search").param("keyword", "Backend summary"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content.length()").value(1))
        .andExpect(jsonPath("$.content[0].title").value("Spring Search"));

    mvc.perform(get("/api/v1/posts/search").param("keyword", "Daily writing"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content.length()").value(1))
        .andExpect(jsonPath("$.content[0].title").value("Personal Note"));
  }

  @Test
  void filtersByYearCategoryTagAndCombinations() throws Exception {
    mvc.perform(get("/api/v1/posts/search").param("year", "2026"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content.length()").value(2));

    mvc.perform(get("/api/v1/posts/search").param("category", "notes"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content.length()").value(1))
        .andExpect(jsonPath("$.content[0].title").value("Personal Note"));

    mvc.perform(get("/api/v1/posts/search").param("tag", "java"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content.length()").value(1))
        .andExpect(jsonPath("$.content[0].title").value("Spring Search"));

    mvc.perform(get("/api/v1/posts/search")
            .param("keyword", "guide")
            .param("year", "2026")
            .param("category", "engineering")
            .param("tag", "vue"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content.length()").value(1))
        .andExpect(jsonPath("$.content[0].title").value("Vue Reading"));
  }

  @Test
  void filtersByTopicAndSeries() throws Exception {
    mvc.perform(get("/api/v1/posts/search").param("topic", "spring-boot"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content.length()").value(1))
        .andExpect(jsonPath("$.content[0].slug").value("spring-search"))
        .andExpect(jsonPath("$.content[0].topics[0].slug").value("security"))
        .andExpect(jsonPath("$.content[0].series.slug").value("build-blog"));

    mvc.perform(get("/api/v1/posts/search").param("series", "build-blog"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content.length()").value(1))
        .andExpect(jsonPath("$.content[0].seriesOrder").value(1));
  }

  @Test
  void paginatesAndSortsWithWhitelistFallback() throws Exception {
    mvc.perform(get("/api/v1/posts/search")
            .param("page", "0")
            .param("size", "2")
            .param("sort", "publishedAt,asc"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content.length()").value(2))
        .andExpect(jsonPath("$.number").value(0))
        .andExpect(jsonPath("$.size").value(2))
        .andExpect(jsonPath("$.totalElements").value(3))
        .andExpect(jsonPath("$.totalPages").value(2))
        .andExpect(jsonPath("$.content[0].title").value("Spring Search"));

    mvc.perform(get("/api/v1/posts/search").param("sort", "createdAt,desc"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[0].title").value("Vue Reading"));
  }

  private Post published(String title, String slug, String summary, String contentHtml,
      Category category, Set<Tag> selectedTags, String publishedAt) {
    Post post = new Post(title, slug, summary, contentHtml, PostStatus.PUBLISHED);
    post.setCategory(category);
    post.setTags(selectedTags);
    post.setPublishedAt(Instant.parse(publishedAt));
    return posts.save(post);
  }
}
