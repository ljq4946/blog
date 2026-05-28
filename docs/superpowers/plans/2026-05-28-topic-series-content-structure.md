# Topic And Series Content Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add flat topics and ordered series to the public technical blog while preserving existing categories and tags.

**Architecture:** Add focused Spring Boot `topic` and `series` packages, extend the existing `Post` model with topic membership and optional series ordering, and expose public/admin endpoints that follow the current category/tag style. Extend shared TypeScript DTOs and API clients, then add admin management screens, post publish-panel fields, public topic/series pages, and article series navigation.

**Tech Stack:** Java 21, Spring Boot 3.3, JPA, Flyway, MockMvc, Vue 3, Vue Router, Element Plus, TypeScript, Vitest, pnpm workspace.

---

## Scope Check

The design covers one cohesive feature: content organization for a public technical blog. It spans backend, shared DTOs, admin UI, and public UI, but all work centers on the same domain model and can be delivered in one versioned implementation plan.

Do not add hierarchical topics, multiple series per post, automatic suggestions, role-based workflows, or a full editor refactor.

## File Structure

Backend files:

- Create `backend/src/main/resources/db/migration/V4__add_topics_series.sql`: schema for topics, series, post-topic links, and post series fields.
- Create `backend/src/main/java/com/example/blog/topic/Topic.java`: topic JPA entity.
- Create `backend/src/main/java/com/example/blog/topic/TopicRepository.java`: topic repository queries.
- Create `backend/src/main/java/com/example/blog/topic/TopicController.java`: public and admin topic endpoints.
- Create `backend/src/main/java/com/example/blog/series/Series.java`: series JPA entity.
- Create `backend/src/main/java/com/example/blog/series/SeriesRepository.java`: series repository queries.
- Create `backend/src/main/java/com/example/blog/series/SeriesController.java`: public and admin series endpoints.
- Modify `backend/src/main/java/com/example/blog/post/Post.java`: add topics, series, and series order fields.
- Modify `backend/src/main/java/com/example/blog/post/PostRepository.java`: add topic and series query methods.
- Modify `backend/src/main/java/com/example/blog/post/PostDtos.java`: add topic, series, and series navigation DTOs.
- Modify `backend/src/main/java/com/example/blog/post/PostService.java`: read/write topic and series fields, add search filters, add previous/next series navigation.
- Modify `backend/src/main/java/com/example/blog/post/PostController.java`: accept topic and series search filters.
- Modify `backend/src/main/java/com/example/blog/config/SecurityConfig.java`: permit public topic and series GET endpoints.
- Modify `backend/src/test/java/com/example/blog/db/FlywayMigrationTest.java`: assert new tables exist.
- Create `backend/src/test/java/com/example/blog/topic/TopicControllerTest.java`: topic public/admin coverage.
- Create `backend/src/test/java/com/example/blog/series/SeriesControllerTest.java`: series public/admin coverage.
- Modify `backend/src/test/java/com/example/blog/content/PostSearchControllerTest.java`: topic/series search and response coverage.

Frontend shared files:

- Modify `frontend/packages/shared/src/types.ts`: add `Topic`, `Series`, topic/series response DTOs, post topic and series fields.
- Modify `frontend/apps/admin/src/lib/api.ts`: add topic and series admin API methods.
- Modify `frontend/apps/admin/src/lib/api.test.ts`: assert admin endpoint paths.
- Modify `frontend/apps/web/src/lib/api.ts`: add public topic and series API methods; add topic and series search params.
- Modify `frontend/apps/web/src/lib/api.test.ts`: assert public endpoint paths and search query params.

Admin frontend files:

- Create `frontend/apps/admin/src/views/TopicsView.vue`: topic management using the existing `CrudPanel`.
- Create `frontend/apps/admin/src/views/TopicsView.test.ts`: topic management behavior.
- Create `frontend/apps/admin/src/views/SeriesView.vue`: series management with optional primary topic select.
- Create `frontend/apps/admin/src/views/SeriesView.test.ts`: series management behavior.
- Modify `frontend/apps/admin/src/router/index.ts`: add `/topics` and `/series`.
- Modify `frontend/apps/admin/src/App.vue`: add sidebar links.
- Modify `frontend/apps/admin/src/features/posts/postForm.ts`: include `topicIds`, `seriesId`, and `seriesOrder`.
- Modify `frontend/apps/admin/src/features/posts/postForm.test.ts`: form serialization, snapshot, and validation coverage.
- Modify `frontend/apps/admin/src/views/PostPublishPanel.vue`: add topic multi-select, series select, and series order input.
- Modify `frontend/apps/admin/src/views/PostPublishPanel.test.ts`: publish panel fields and emitted updates.
- Modify `frontend/apps/admin/src/views/PostEditorView.vue`: load topics/series and bind them to the publish panel.
- Modify `frontend/apps/admin/src/views/PostEditorView.test.ts`: editor load/save payload coverage.

Public frontend files:

- Create `frontend/apps/web/src/views/TopicIndexView.vue`: public topic index.
- Create `frontend/apps/web/src/views/TopicDetailView.vue`: public topic detail.
- Create `frontend/apps/web/src/views/SeriesIndexView.vue`: public series index.
- Create `frontend/apps/web/src/views/SeriesDetailView.vue`: public series detail.
- Create `frontend/apps/web/src/views/TopicIndexView.test.ts`: topic index rendering.
- Create `frontend/apps/web/src/views/TopicDetailView.test.ts`: topic detail rendering.
- Create `frontend/apps/web/src/views/SeriesIndexView.test.ts`: series index rendering.
- Create `frontend/apps/web/src/views/SeriesDetailView.test.ts`: series detail rendering.
- Modify `frontend/apps/web/src/router/index.ts`: add topic and series routes.
- Modify `frontend/apps/web/src/router/index.test.ts`: route coverage.
- Modify `frontend/apps/web/src/App.vue`: add topic and series navigation links.
- Modify `frontend/apps/web/src/views/PostDetailView.vue`: show linked topics and series previous/next navigation.
- Modify `frontend/apps/web/src/views/PostDetailView.test.ts`: article topic and series navigation coverage.
- Modify `frontend/apps/web/src/components/ArchiveFilters.vue`: add topic and series filters.
- Modify `frontend/apps/web/src/components/ArchiveFilters.test.ts`: filter emit coverage.
- Modify `frontend/apps/web/src/views/ArchiveView.vue`: load topics/series and include filters in search params.
- Modify `frontend/apps/web/src/views/ArchiveView.test.ts`: archive query restore and topic/series search coverage.
- Modify `frontend/apps/web/src/styles.css`: add topic/series page and series navigation styles.

## Task 1: Backend Schema And Domain Model

**Files:**

- Create: `backend/src/main/resources/db/migration/V4__add_topics_series.sql`
- Create: `backend/src/main/java/com/example/blog/topic/Topic.java`
- Create: `backend/src/main/java/com/example/blog/topic/TopicRepository.java`
- Create: `backend/src/main/java/com/example/blog/series/Series.java`
- Create: `backend/src/main/java/com/example/blog/series/SeriesRepository.java`
- Modify: `backend/src/main/java/com/example/blog/post/Post.java`
- Modify: `backend/src/test/java/com/example/blog/db/FlywayMigrationTest.java`

- [ ] **Step 1: Write the failing migration expectation**

Modify `backend/src/test/java/com/example/blog/db/FlywayMigrationTest.java` so the table assertion includes the new content structure tables:

```java
assertThat(tables).contains(
    "users", "posts", "categories", "tags", "post_tags", "media_assets", "site_pages",
    "topics", "post_topics", "series");
```

- [ ] **Step 2: Run the migration test to verify it fails**

Run from `backend`:

```powershell
.\mvnw.cmd -Dtest=FlywayMigrationTest test
```

Expected: FAIL because `topics`, `post_topics`, and `series` do not exist.

- [ ] **Step 3: Add the Flyway migration**

Create `backend/src/main/resources/db/migration/V4__add_topics_series.sql`:

```sql
CREATE TABLE topics (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  CONSTRAINT uk_topics_name UNIQUE (name),
  CONSTRAINT uk_topics_slug UNIQUE (slug)
);

CREATE TABLE series (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  description TEXT,
  primary_topic_id BIGINT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  CONSTRAINT uk_series_name UNIQUE (name),
  CONSTRAINT uk_series_slug UNIQUE (slug),
  CONSTRAINT fk_series_primary_topic FOREIGN KEY (primary_topic_id) REFERENCES topics(id)
);

CREATE TABLE post_topics (
  post_id BIGINT NOT NULL,
  topic_id BIGINT NOT NULL,
  PRIMARY KEY (post_id, topic_id),
  CONSTRAINT fk_post_topics_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_post_topics_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

ALTER TABLE posts
  ADD COLUMN series_id BIGINT,
  ADD COLUMN series_order INT,
  ADD CONSTRAINT fk_posts_series FOREIGN KEY (series_id) REFERENCES series(id),
  ADD CONSTRAINT ck_posts_series_order_pair CHECK (
    (series_id IS NULL AND series_order IS NULL)
    OR
    (series_id IS NOT NULL AND series_order IS NOT NULL AND series_order > 0)
  ),
  ADD CONSTRAINT uk_posts_series_order UNIQUE (series_id, series_order);

CREATE INDEX idx_topics_sort_name ON topics(sort_order, name);
CREATE INDEX idx_series_sort_name ON series(sort_order, name);
CREATE INDEX idx_series_primary_topic ON series(primary_topic_id, sort_order, name);
CREATE INDEX idx_post_topics_topic ON post_topics(topic_id, post_id);
CREATE INDEX idx_posts_series_order ON posts(series_id, series_order);
```

- [ ] **Step 4: Add `Topic` and `TopicRepository`**

Create `backend/src/main/java/com/example/blog/topic/Topic.java` using the same timestamp and update style as `Category`:

```java
package com.example.blog.topic;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "topics")
public class Topic {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String name;

  @Column(nullable = false, unique = true)
  private String slug;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(name = "sort_order", nullable = false)
  private int sortOrder;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected Topic() {
  }

  public Topic(String name, String slug, String description, int sortOrder) {
    this.name = name;
    this.slug = slug;
    this.description = description;
    this.sortOrder = sortOrder;
  }

  @PrePersist
  void prePersist() {
    Instant now = Instant.now();
    createdAt = now;
    updatedAt = now;
  }

  @PreUpdate
  void preUpdate() {
    updatedAt = Instant.now();
  }

  public void update(String name, String slug, String description, int sortOrder) {
    this.name = name;
    this.slug = slug;
    this.description = description;
    this.sortOrder = sortOrder;
  }

  public Long getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public String getSlug() {
    return slug;
  }

  public String getDescription() {
    return description;
  }

  public int getSortOrder() {
    return sortOrder;
  }
}
```

Create `backend/src/main/java/com/example/blog/topic/TopicRepository.java`:

```java
package com.example.blog.topic;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TopicRepository extends JpaRepository<Topic, Long> {
  List<Topic> findAllByOrderBySortOrderAscNameAsc();

  Optional<Topic> findBySlug(String slug);
}
```

- [ ] **Step 5: Add `Series` and `SeriesRepository`**

Create `backend/src/main/java/com/example/blog/series/Series.java`:

```java
package com.example.blog.series;

import com.example.blog.topic.Topic;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "series")
public class Series {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String name;

  @Column(nullable = false, unique = true)
  private String slug;

  @Column(columnDefinition = "TEXT")
  private String description;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "primary_topic_id")
  private Topic primaryTopic;

  @Column(name = "sort_order", nullable = false)
  private int sortOrder;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected Series() {
  }

  public Series(String name, String slug, String description, Topic primaryTopic, int sortOrder) {
    this.name = name;
    this.slug = slug;
    this.description = description;
    this.primaryTopic = primaryTopic;
    this.sortOrder = sortOrder;
  }

  @PrePersist
  void prePersist() {
    Instant now = Instant.now();
    createdAt = now;
    updatedAt = now;
  }

  @PreUpdate
  void preUpdate() {
    updatedAt = Instant.now();
  }

  public void update(String name, String slug, String description, Topic primaryTopic, int sortOrder) {
    this.name = name;
    this.slug = slug;
    this.description = description;
    this.primaryTopic = primaryTopic;
    this.sortOrder = sortOrder;
  }

  public Long getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public String getSlug() {
    return slug;
  }

  public String getDescription() {
    return description;
  }

  public Topic getPrimaryTopic() {
    return primaryTopic;
  }

  public int getSortOrder() {
    return sortOrder;
  }
}
```

Create `backend/src/main/java/com/example/blog/series/SeriesRepository.java`:

```java
package com.example.blog.series;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SeriesRepository extends JpaRepository<Series, Long> {

  @EntityGraph(attributePaths = {"primaryTopic"})
  List<Series> findAllByOrderBySortOrderAscNameAsc();

  @EntityGraph(attributePaths = {"primaryTopic"})
  Optional<Series> findBySlug(String slug);

  @EntityGraph(attributePaths = {"primaryTopic"})
  List<Series> findByPrimaryTopicSlugOrderBySortOrderAscNameAsc(String slug);
}
```

- [ ] **Step 6: Extend `Post` with topics and series**

Modify `backend/src/main/java/com/example/blog/post/Post.java` imports:

```java
import com.example.blog.series.Series;
import com.example.blog.topic.Topic;
```

Add these fields after the existing `tags` field:

```java
  @ManyToMany
  @JoinTable(
      name = "post_topics",
      joinColumns = @JoinColumn(name = "post_id"),
      inverseJoinColumns = @JoinColumn(name = "topic_id"))
  private Set<Topic> topics = new HashSet<>();

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "series_id")
  private Series series;

  @Column(name = "series_order")
  private Integer seriesOrder;
```

Add these accessors near the existing tag accessors:

```java
  public Set<Topic> getTopics() {
    return topics;
  }

  public void setTopics(Set<Topic> topics) {
    this.topics = new HashSet<>(topics);
  }

  public Series getSeries() {
    return series;
  }

  public void setSeries(Series series) {
    this.series = series;
  }

  public Integer getSeriesOrder() {
    return seriesOrder;
  }

  public void setSeriesOrder(Integer seriesOrder) {
    this.seriesOrder = seriesOrder;
  }
```

- [ ] **Step 7: Run focused migration test**

Run from `backend`:

```powershell
.\mvnw.cmd -Dtest=FlywayMigrationTest test
```

Expected: PASS when Docker is available. If Docker is unavailable, note that this Testcontainers test was skipped by `disabledWithoutDocker`.

- [ ] **Step 8: Commit schema and domain model**

```powershell
git add backend\src\main\resources\db\migration\V4__add_topics_series.sql backend\src\main\java\com\example\blog\topic backend\src\main\java\com\example\blog\series backend\src\main\java\com\example\blog\post\Post.java backend\src\test\java\com\example\blog\db\FlywayMigrationTest.java
git commit -m "feat: add topic and series domain model"
```

## Task 2: Backend Topic API

**Files:**

- Create: `backend/src/main/java/com/example/blog/topic/TopicController.java`
- Create: `backend/src/test/java/com/example/blog/topic/TopicControllerTest.java`
- Modify: `backend/src/main/java/com/example/blog/post/PostRepository.java`
- Modify: `backend/src/main/java/com/example/blog/config/SecurityConfig.java`

- [ ] **Step 1: Write failing topic controller tests**

Create `backend/src/test/java/com/example/blog/topic/TopicControllerTest.java`:

```java
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

    String created = mvc.perform(post("/api/v1/admin/topics")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"name":"Security","slug":"security","description":"Auth notes","sortOrder":3}
                """))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.slug").value("security"))
        .andReturn().getResponse().getContentAsString();

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
```

- [ ] **Step 2: Run topic tests to verify failure**

Run from `backend`:

```powershell
.\mvnw.cmd -Dtest=TopicControllerTest test
```

Expected: FAIL because `TopicController` and topic post queries do not exist.

- [ ] **Step 3: Add topic post query**

Modify `backend/src/main/java/com/example/blog/post/PostRepository.java` to include topics in entity graphs and add the topic query:

```java
  @EntityGraph(attributePaths = {"category", "tags", "topics", "series", "series.primaryTopic"})
  List<Post> findByTopicsSlugAndStatusOrderByPublishedAtDescCreatedAtDesc(String slug, PostStatus status);
```

Also extend the existing `@EntityGraph(attributePaths = {"category", "tags"})` annotations in `PostRepository` to:

```java
@EntityGraph(attributePaths = {"category", "tags", "topics", "series", "series.primaryTopic"})
```

- [ ] **Step 4: Permit public topic GET endpoints**

Modify `backend/src/main/java/com/example/blog/config/SecurityConfig.java` inside the public GET matcher:

```java
                "/api/v1/topics",
                "/api/v1/topics/**",
```

- [ ] **Step 5: Add `TopicController`**

Create `backend/src/main/java/com/example/blog/topic/TopicController.java`:

```java
package com.example.blog.topic;

import com.example.blog.post.Post;
import com.example.blog.post.PostRepository;
import com.example.blog.post.PostStatus;
import com.example.blog.series.Series;
import com.example.blog.series.SeriesRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
public class TopicController {

  private final TopicRepository topics;
  private final SeriesRepository series;
  private final PostRepository posts;

  public TopicController(TopicRepository topics, SeriesRepository series, PostRepository posts) {
    this.topics = topics;
    this.series = series;
    this.posts = posts;
  }

  @GetMapping({"/api/v1/topics", "/api/v1/admin/topics"})
  public List<TopicResponse> list() {
    return topics.findAllByOrderBySortOrderAscNameAsc().stream().map(TopicResponse::from).toList();
  }

  @GetMapping("/api/v1/topics/{slug}")
  public TopicDetailResponse detail(@PathVariable String slug) {
    Topic topic = topics.findBySlug(slug).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    return new TopicDetailResponse(
        TopicResponse.from(topic),
        series.findByPrimaryTopicSlugOrderBySortOrderAscNameAsc(slug).stream().map(SeriesSummary::from).toList(),
        posts.findByTopicsSlugAndStatusOrderByPublishedAtDescCreatedAtDesc(slug, PostStatus.PUBLISHED)
            .stream().map(PostSummary::from).toList());
  }

  @PostMapping("/api/v1/admin/topics")
  @ResponseStatus(HttpStatus.CREATED)
  public TopicResponse create(@Valid @RequestBody TopicRequest request) {
    return TopicResponse.from(topics.save(new Topic(
        request.name(), request.slug(), request.description(), request.sortOrder())));
  }

  @PutMapping("/api/v1/admin/topics/{id}")
  public TopicResponse update(@PathVariable Long id, @Valid @RequestBody TopicRequest request) {
    Topic topic = topics.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    topic.update(request.name(), request.slug(), request.description(), request.sortOrder());
    return TopicResponse.from(topics.save(topic));
  }

  @DeleteMapping("/api/v1/admin/topics/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable Long id) {
    topics.deleteById(id);
  }

  public record TopicRequest(@NotBlank String name, @NotBlank String slug, String description, int sortOrder) {
  }

  public record TopicResponse(Long id, String name, String slug, String description, int sortOrder) {
    public static TopicResponse from(Topic topic) {
      return new TopicResponse(
          topic.getId(), topic.getName(), topic.getSlug(), topic.getDescription(), topic.getSortOrder());
    }
  }

  public record TopicDetailResponse(TopicResponse topic, List<SeriesSummary> relatedSeries, List<PostSummary> posts) {
  }

  public record SeriesSummary(Long id, String name, String slug, String description, int sortOrder) {
    public static SeriesSummary from(Series series) {
      return new SeriesSummary(
          series.getId(), series.getName(), series.getSlug(), series.getDescription(), series.getSortOrder());
    }
  }

  public record PostSummary(Long id, String title, String slug, String summary, String publishedAt) {
    public static PostSummary from(Post post) {
      return new PostSummary(
          post.getId(),
          post.getTitle(),
          post.getSlug(),
          post.getSummary(),
          post.getPublishedAt() == null ? null : post.getPublishedAt().toString());
    }
  }
}
```

- [ ] **Step 6: Run topic tests to verify pass**

Run from `backend`:

```powershell
.\mvnw.cmd -Dtest=TopicControllerTest test
```

Expected: PASS.

- [ ] **Step 7: Commit topic API**

```powershell
git add backend\src\main\java\com\example\blog\topic backend\src\main\java\com\example\blog\post\PostRepository.java backend\src\main\java\com\example\blog\config\SecurityConfig.java backend\src\test\java\com\example\blog\topic\TopicControllerTest.java
git commit -m "feat: add topic endpoints"
```

## Task 3: Backend Series API

**Files:**

- Create: `backend/src/main/java/com/example/blog/series/SeriesController.java`
- Create: `backend/src/test/java/com/example/blog/series/SeriesControllerTest.java`
- Modify: `backend/src/main/java/com/example/blog/post/PostRepository.java`
- Modify: `backend/src/main/java/com/example/blog/config/SecurityConfig.java`

- [ ] **Step 1: Write failing series controller tests**

Create `backend/src/test/java/com/example/blog/series/SeriesControllerTest.java`:

```java
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
```

- [ ] **Step 2: Run series tests to verify failure**

Run from `backend`:

```powershell
.\mvnw.cmd -Dtest=SeriesControllerTest test
```

Expected: FAIL because `SeriesController` and series post queries do not exist.

- [ ] **Step 3: Add series post queries**

Modify `backend/src/main/java/com/example/blog/post/PostRepository.java`:

```java
  @EntityGraph(attributePaths = {"category", "tags", "topics", "series", "series.primaryTopic"})
  List<Post> findBySeriesSlugAndStatusOrderBySeriesOrderAsc(String slug, PostStatus status);

  boolean existsBySeriesId(Long seriesId);
```

- [ ] **Step 4: Permit public series GET endpoints**

Modify `backend/src/main/java/com/example/blog/config/SecurityConfig.java` inside the public GET matcher:

```java
                "/api/v1/series",
                "/api/v1/series/**",
```

- [ ] **Step 5: Add `SeriesController`**

Create `backend/src/main/java/com/example/blog/series/SeriesController.java`:

```java
package com.example.blog.series;

import com.example.blog.post.Post;
import com.example.blog.post.PostRepository;
import com.example.blog.post.PostStatus;
import com.example.blog.topic.Topic;
import com.example.blog.topic.TopicRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
public class SeriesController {

  private final SeriesRepository series;
  private final TopicRepository topics;
  private final PostRepository posts;

  public SeriesController(SeriesRepository series, TopicRepository topics, PostRepository posts) {
    this.series = series;
    this.topics = topics;
    this.posts = posts;
  }

  @GetMapping({"/api/v1/series", "/api/v1/admin/series"})
  public List<SeriesResponse> list() {
    return series.findAllByOrderBySortOrderAscNameAsc().stream().map(SeriesResponse::from).toList();
  }

  @GetMapping("/api/v1/series/{slug}")
  public SeriesDetailResponse detail(@PathVariable String slug) {
    Series found = series.findBySlug(slug).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    return new SeriesDetailResponse(
        SeriesResponse.from(found),
        posts.findBySeriesSlugAndStatusOrderBySeriesOrderAsc(slug, PostStatus.PUBLISHED)
            .stream().map(PostSummary::from).toList());
  }

  @PostMapping("/api/v1/admin/series")
  @ResponseStatus(HttpStatus.CREATED)
  public SeriesResponse create(@Valid @RequestBody SeriesRequest request) {
    Topic primaryTopic = primaryTopic(request.primaryTopicId());
    return SeriesResponse.from(series.save(new Series(
        request.name(), request.slug(), request.description(), primaryTopic, request.sortOrder())));
  }

  @PutMapping("/api/v1/admin/series/{id}")
  public SeriesResponse update(@PathVariable Long id, @Valid @RequestBody SeriesRequest request) {
    Series found = series.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    found.update(request.name(), request.slug(), request.description(), primaryTopic(request.primaryTopicId()), request.sortOrder());
    return SeriesResponse.from(series.save(found));
  }

  @DeleteMapping("/api/v1/admin/series/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable Long id) {
    if (posts.existsBySeriesId(id)) {
      throw new IllegalArgumentException("Series has attached posts");
    }
    series.deleteById(id);
  }

  private Topic primaryTopic(Long id) {
    return id == null ? null : topics.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Unknown topic"));
  }

  public record SeriesRequest(
      @NotBlank String name,
      @NotBlank String slug,
      String description,
      Long primaryTopicId,
      int sortOrder) {
  }

  public record TopicSummary(Long id, String name, String slug) {
    public static TopicSummary from(Topic topic) {
      return new TopicSummary(topic.getId(), topic.getName(), topic.getSlug());
    }
  }

  public record SeriesResponse(Long id, String name, String slug, String description, TopicSummary primaryTopic, int sortOrder) {
    public static SeriesResponse from(Series series) {
      return new SeriesResponse(
          series.getId(),
          series.getName(),
          series.getSlug(),
          series.getDescription(),
          series.getPrimaryTopic() == null ? null : TopicSummary.from(series.getPrimaryTopic()),
          series.getSortOrder());
    }
  }

  public record SeriesDetailResponse(SeriesResponse series, List<PostSummary> posts) {
  }

  public record PostSummary(Long id, String title, String slug, String summary, Integer seriesOrder, String publishedAt) {
    public static PostSummary from(Post post) {
      return new PostSummary(
          post.getId(),
          post.getTitle(),
          post.getSlug(),
          post.getSummary(),
          post.getSeriesOrder(),
          post.getPublishedAt() == null ? null : post.getPublishedAt().toString());
    }
  }
}
```

- [ ] **Step 6: Run series tests to verify pass**

Run from `backend`:

```powershell
.\mvnw.cmd -Dtest=SeriesControllerTest test
```

Expected: PASS.

- [ ] **Step 7: Commit series API**

```powershell
git add backend\src\main\java\com\example\blog\series\SeriesController.java backend\src\main\java\com\example\blog\post\PostRepository.java backend\src\main\java\com\example\blog\config\SecurityConfig.java backend\src\test\java\com\example\blog\series\SeriesControllerTest.java
git commit -m "feat: add series endpoints"
```

## Task 4: Backend Post Integration

**Files:**

- Modify: `backend/src/main/java/com/example/blog/post/PostDtos.java`
- Modify: `backend/src/main/java/com/example/blog/post/PostService.java`
- Modify: `backend/src/main/java/com/example/blog/post/PostController.java`
- Modify: `backend/src/main/java/com/example/blog/post/PostRepository.java`
- Modify: `backend/src/test/java/com/example/blog/content/PostSearchControllerTest.java`
- Create: `backend/src/test/java/com/example/blog/content/PostContentStructureControllerTest.java`

- [ ] **Step 1: Add failing search assertions for topic and series filters**

Modify `backend/src/test/java/com/example/blog/content/PostSearchControllerTest.java`:

Add fields:

```java
@Autowired
TopicRepository topics;
@Autowired
SeriesRepository series;

Topic spring;
Topic security;
Series buildBlog;
```

In `setUp()`, delete and create content structure data in dependency order:

```java
posts.deleteAll();
series.deleteAll();
topics.deleteAll();
tags.deleteAll();
categories.deleteAll();

spring = topics.save(new Topic("Spring Boot", "spring-boot", "Backend topic", 0));
security = topics.save(new Topic("Security", "security", "Security topic", 1));
buildBlog = series.save(new Series("Build Blog", "build-blog", "Project series", spring, 0));
```

After creating the `Spring Search` post, assign:

```java
Post springPost = published("Spring Search", "spring-search", "Backend summary", "<p>Criteria query guide</p>",
    engineering, Set.of(java), "2025-04-10T00:00:00Z");
springPost.setTopics(Set.of(spring, security));
springPost.setSeries(buildBlog);
springPost.setSeriesOrder(1);
posts.save(springPost);
```

Add this test:

```java
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
```

- [ ] **Step 2: Add failing post create/update tests**

Create `backend/src/test/java/com/example/blog/content/PostContentStructureControllerTest.java`:

```java
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
```

- [ ] **Step 3: Run focused tests to verify failure**

Run from `backend`:

```powershell
.\mvnw.cmd -Dtest=PostSearchControllerTest,PostContentStructureControllerTest test
```

Expected: FAIL because `PostDtos`, `PostService`, and `PostController` do not support topic/series fields.

- [ ] **Step 4: Extend `PostRepository` for series navigation**

Add methods to `backend/src/main/java/com/example/blog/post/PostRepository.java`:

```java
  @EntityGraph(attributePaths = {"category", "tags", "topics", "series", "series.primaryTopic"})
  Optional<Post> findFirstBySeriesIdAndStatusAndSeriesOrderLessThanOrderBySeriesOrderDesc(
      Long seriesId, PostStatus status, Integer seriesOrder);

  @EntityGraph(attributePaths = {"category", "tags", "topics", "series", "series.primaryTopic"})
  Optional<Post> findFirstBySeriesIdAndStatusAndSeriesOrderGreaterThanOrderBySeriesOrderAsc(
      Long seriesId, PostStatus status, Integer seriesOrder);
```

- [ ] **Step 5: Extend post DTOs**

Modify `backend/src/main/java/com/example/blog/post/PostDtos.java`:

Add imports:

```java
import com.example.blog.series.Series;
import com.example.blog.topic.Topic;
```

Change `PostRequest` to:

```java
public record PostRequest(
    String title,
    String slug,
    String summary,
    String contentHtml,
    Long coverMediaId,
    PostStatus status,
    Long categoryId,
    Set<Long> topicIds,
    Long seriesId,
    Integer seriesOrder,
    Set<Long> tagIds,
    Instant publishedAt) {
}
```

Change `PostResponse` fields to include topics, series, and navigation:

```java
public record PostResponse(
    Long id,
    String title,
    String slug,
    String summary,
    String contentHtml,
    Long coverMediaId,
    String coverMediaUrl,
    String status,
    CategorySummary category,
    List<TopicSummary> topics,
    SeriesSummary series,
    Integer seriesOrder,
    SeriesPostSummary previousSeriesPost,
    SeriesPostSummary nextSeriesPost,
    List<TagSummary> tags,
    Instant createdAt,
    Instant updatedAt,
    Instant publishedAt) {
```

Add summaries:

```java
public record TopicSummary(Long id, String name, String slug) {
  static TopicSummary from(Topic topic) {
    return new TopicSummary(topic.getId(), topic.getName(), topic.getSlug());
  }
}

public record SeriesSummary(Long id, String name, String slug, TopicSummary primaryTopic) {
  static SeriesSummary from(Series series) {
    return new SeriesSummary(
        series.getId(),
        series.getName(),
        series.getSlug(),
        series.getPrimaryTopic() == null ? null : TopicSummary.from(series.getPrimaryTopic()));
  }
}

public record SeriesPostSummary(Long id, String title, String slug, Integer seriesOrder) {
  static SeriesPostSummary from(Post post) {
    return new SeriesPostSummary(post.getId(), post.getTitle(), post.getSlug(), post.getSeriesOrder());
  }
}
```

Change `PostSearchRequest` to include topic and series:

```java
public record PostSearchRequest(
    Optional<String> keyword,
    Optional<Integer> year,
    Optional<String> category,
    Optional<String> tag,
    Optional<String> topic,
    Optional<String> series,
    Optional<Integer> page,
    Optional<Integer> size,
    Optional<String> sort) {
}
```

- [ ] **Step 6: Extend `PostService` dependencies and apply logic**

Modify constructor dependencies in `backend/src/main/java/com/example/blog/post/PostService.java`:

```java
private final TopicRepository topics;
private final SeriesRepository series;
```

Use constructor parameters:

```java
public PostService(PostRepository posts, CategoryRepository categories, TagRepository tags,
    TopicRepository topics, SeriesRepository series, MediaAssetRepository media, HtmlSanitizer sanitizer) {
  this.posts = posts;
  this.categories = categories;
  this.tags = tags;
  this.topics = topics;
  this.series = series;
  this.media = media;
  this.sanitizer = sanitizer;
}
```

In `search`, add filters:

```java
.and(topicSlugMatches(request.topic()))
.and(seriesSlugMatches(request.series()));
```

In `apply`, add topic and series handling:

```java
Set<Long> topicIds = request.topicIds() == null ? Set.of() : request.topicIds();
List<Topic> selectedTopics = topics.findAllById(topicIds);
if (selectedTopics.size() != topicIds.size()) {
  throw new IllegalArgumentException("Unknown topic");
}
post.setTopics(new HashSet<>(selectedTopics));

if (request.seriesId() == null) {
  if (request.seriesOrder() != null) {
    throw new IllegalArgumentException("seriesOrder requires seriesId");
  }
  post.setSeries(null);
  post.setSeriesOrder(null);
} else {
  if (request.seriesOrder() == null || request.seriesOrder() < 1) {
    throw new IllegalArgumentException("seriesOrder must be a positive number");
  }
  Series selectedSeries = series.findById(request.seriesId())
      .orElseThrow(() -> new IllegalArgumentException("Unknown series"));
  post.setSeries(selectedSeries);
  post.setSeriesOrder(request.seriesOrder());
}
```

Add specifications:

```java
private Specification<Post> topicSlugMatches(Optional<String> topicSlug) {
  return normalizedText(topicSlug)
      .<Specification<Post>>map(slug -> (root, query, criteria) -> {
        query.distinct(true);
        return criteria.equal(root.join("topics", JoinType.INNER).get("slug"), slug);
      })
      .orElse(null);
}

private Specification<Post> seriesSlugMatches(Optional<String> seriesSlug) {
  return normalizedText(seriesSlug)
      .<Specification<Post>>map(slug -> (root, query, criteria) ->
          criteria.equal(root.join("series", JoinType.INNER).get("slug"), slug))
      .orElse(null);
}
```

- [ ] **Step 7: Add previous/next navigation only for public detail responses**

Modify `PostService.publicDetail`:

```java
public PostResponse publicDetail(String slug) {
  Post post = posts.findBySlugAndStatus(slug, PostStatus.PUBLISHED)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
  return responseWithSeriesNavigation(post);
}
```

Add helper:

```java
private PostResponse responseWithSeriesNavigation(Post post) {
  SeriesPostSummary previous = null;
  SeriesPostSummary next = null;
  if (post.getSeries() != null && post.getSeriesOrder() != null) {
    Long seriesId = post.getSeries().getId();
    previous = posts.findFirstBySeriesIdAndStatusAndSeriesOrderLessThanOrderBySeriesOrderDesc(
            seriesId, PostStatus.PUBLISHED, post.getSeriesOrder())
        .map(SeriesPostSummary::from)
        .orElse(null);
    next = posts.findFirstBySeriesIdAndStatusAndSeriesOrderGreaterThanOrderBySeriesOrderAsc(
            seriesId, PostStatus.PUBLISHED, post.getSeriesOrder())
        .map(SeriesPostSummary::from)
        .orElse(null);
  }
  return PostResponse.from(post, coverMediaUrl(post), previous, next);
}
```

- [ ] **Step 8: Extend `PostController` search params**

Modify `backend/src/main/java/com/example/blog/post/PostController.java` public search method:

```java
      @RequestParam Optional<String> topic,
      @RequestParam Optional<String> series,
```

Pass both fields into `PostSearchRequest`:

```java
return postService.search(new PostSearchRequest(keyword, year, category, tag, topic, series, page, size, sort));
```

- [ ] **Step 9: Run backend post integration tests**

Run from `backend`:

```powershell
.\mvnw.cmd -Dtest=PostSearchControllerTest,PostContentStructureControllerTest test
```

Expected: PASS.

- [ ] **Step 10: Commit backend post integration**

```powershell
git add backend\src\main\java\com\example\blog\post backend\src\test\java\com\example\blog\content\PostSearchControllerTest.java backend\src\test\java\com\example\blog\content\PostContentStructureControllerTest.java
git commit -m "feat: attach posts to topics and series"
```

## Task 5: Shared Types And API Clients

**Files:**

- Modify: `frontend/packages/shared/src/types.ts`
- Modify: `frontend/apps/admin/src/lib/api.ts`
- Modify: `frontend/apps/admin/src/lib/api.test.ts`
- Modify: `frontend/apps/web/src/lib/api.ts`
- Modify: `frontend/apps/web/src/lib/api.test.ts`

- [ ] **Step 1: Write failing admin API path assertions**

Add this test to `frontend/apps/admin/src/lib/api.test.ts`:

```ts
it("calls admin topic and series endpoints", async () => {
  const fetchMock = vi.fn(async () => new Response(
    JSON.stringify([]),
    { headers: { "Content-Type": "application/json" } }
  ));
  vi.stubGlobal("fetch", fetchMock);
  const { adminApi } = await import("./api");

  await adminApi.topics();
  await adminApi.saveTopic({ name: "Spring Boot", slug: "spring-boot", description: "Backend", sortOrder: 0 });
  await adminApi.deleteTopic(3);
  await adminApi.series();
  await adminApi.saveSeries({ name: "Build Blog", slug: "build-blog", description: "Project", primaryTopicId: 3, sortOrder: 0 });
  await adminApi.deleteSeries(4);

  expect(fetchMock.mock.calls.map((call) => [call[0], call[1]?.method ?? "GET"])).toEqual([
    ["/api/v1/admin/topics", "GET"],
    ["/api/v1/admin/topics", "POST"],
    ["/api/v1/admin/topics/3", "DELETE"],
    ["/api/v1/admin/series", "GET"],
    ["/api/v1/admin/series", "POST"],
    ["/api/v1/admin/series/4", "DELETE"]
  ]);
});
```

- [ ] **Step 2: Write failing public API path assertions**

Add this test to `frontend/apps/web/src/lib/api.test.ts`:

```ts
it("calls public topic and series endpoints and includes search filters", async () => {
  const fetchMock = vi.fn(async () => new Response(
    JSON.stringify({ content: [], number: 0, size: 10, totalElements: 0, totalPages: 0 }),
    { headers: { "Content-Type": "application/json" } }
  ));
  vi.stubGlobal("fetch", fetchMock);
  const { publicApi } = await import("./api");

  await publicApi.topics();
  await publicApi.topic("spring-boot");
  await publicApi.seriesList();
  await publicApi.series("build-blog");
  await publicApi.searchPosts({ topic: "spring-boot", series: "build-blog", page: 0, size: 10 });

  expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
    "/api/v1/topics",
    "/api/v1/topics/spring-boot",
    "/api/v1/series",
    "/api/v1/series/build-blog",
    "/api/v1/posts/search?topic=spring-boot&series=build-blog&page=0&size=10"
  ]);
});
```

- [ ] **Step 3: Run frontend API tests to verify failure**

Run from `frontend`:

```powershell
corepack pnpm --filter @blog/admin test -- api.test.ts
corepack pnpm --filter @blog/web test -- api.test.ts
```

Expected: FAIL because new methods and types do not exist.

- [ ] **Step 4: Extend shared types**

Modify `frontend/packages/shared/src/types.ts`:

```ts
export interface Topic {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
}

export interface TopicInput {
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
}

export interface Series {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  primaryTopic?: Pick<Topic, "id" | "name" | "slug"> | null;
  sortOrder: number;
}

export interface SeriesInput {
  name: string;
  slug: string;
  description?: string | null;
  primaryTopicId?: number | null;
  sortOrder: number;
}

export interface SeriesPostSummary {
  id: number;
  title: string;
  slug: string;
  seriesOrder?: number | null;
}

export interface TopicDetail {
  topic: Topic;
  relatedSeries: Series[];
  posts: Post[];
}

export interface SeriesDetail {
  series: Series;
  posts: Post[];
}
```

Extend `Post`:

```ts
topics?: Array<Pick<Topic, "id" | "name" | "slug">>;
series?: Pick<Series, "id" | "name" | "slug" | "primaryTopic"> | null;
seriesOrder?: number | null;
previousSeriesPost?: SeriesPostSummary | null;
nextSeriesPost?: SeriesPostSummary | null;
```

Extend `PostInput`:

```ts
topicIds: number[];
seriesId?: number | null;
seriesOrder?: number | null;
```

- [ ] **Step 5: Extend admin API client**

Modify `frontend/apps/admin/src/lib/api.ts` imports:

```ts
  type Series,
  type SeriesInput,
  type Topic,
  type TopicInput
```

Add methods to `adminApi`:

```ts
  topics() {
    return api.get<Topic[]>("/v1/admin/topics");
  },
  saveTopic(topic: Partial<TopicInput> & { id?: number }) {
    return topic.id ? api.put<Topic>(`/v1/admin/topics/${topic.id}`, topic) : api.post<Topic>("/v1/admin/topics", topic);
  },
  deleteTopic(id: number) {
    return api.delete(`/v1/admin/topics/${id}`);
  },
  series() {
    return api.get<Series[]>("/v1/admin/series");
  },
  saveSeries(series: Partial<SeriesInput> & { id?: number }) {
    return series.id ? api.put<Series>(`/v1/admin/series/${series.id}`, series) : api.post<Series>("/v1/admin/series", series);
  },
  deleteSeries(id: number) {
    return api.delete(`/v1/admin/series/${id}`);
  }
```

- [ ] **Step 6: Extend public API client**

Modify `frontend/apps/web/src/lib/api.ts` imports:

```ts
  type Series,
  type SeriesDetail,
  type Topic,
  type TopicDetail
```

Extend `PostSearchParams`:

```ts
topic?: string | null;
series?: string | null;
```

Add methods to `publicApi`:

```ts
  topics() {
    return api.get<Topic[]>("/v1/topics");
  },
  topic(slug: string) {
    return api.get<TopicDetail>(`/v1/topics/${slug}`);
  },
  seriesList() {
    return api.get<Series[]>("/v1/series");
  },
  series(slug: string) {
    return api.get<SeriesDetail>(`/v1/series/${slug}`);
  }
```

- [ ] **Step 7: Run frontend API tests to verify pass**

Run from `frontend`:

```powershell
corepack pnpm --filter @blog/admin test -- api.test.ts
corepack pnpm --filter @blog/web test -- api.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit shared types and API clients**

```powershell
git add frontend\packages\shared\src\types.ts frontend\apps\admin\src\lib\api.ts frontend\apps\admin\src\lib\api.test.ts frontend\apps\web\src\lib\api.ts frontend\apps\web\src\lib\api.test.ts
git commit -m "feat: add topic and series frontend APIs"
```

## Task 6: Admin Topic And Series Management

**Files:**

- Create: `frontend/apps/admin/src/views/TopicsView.vue`
- Create: `frontend/apps/admin/src/views/TopicsView.test.ts`
- Create: `frontend/apps/admin/src/views/SeriesView.vue`
- Create: `frontend/apps/admin/src/views/SeriesView.test.ts`
- Modify: `frontend/apps/admin/src/router/index.ts`
- Modify: `frontend/apps/admin/src/router/index.test.ts`
- Modify: `frontend/apps/admin/src/App.vue`
- Modify: `frontend/apps/admin/src/App.test.ts`

- [ ] **Step 1: Write failing admin view tests**

Create `frontend/apps/admin/src/views/TopicsView.test.ts`:

```ts
import { mount } from "@vue/test-utils";
import ElementPlus from "element-plus";
import { describe, expect, it, vi } from "vitest";
import TopicsView from "./TopicsView.vue";

vi.mock("../lib/api", () => ({
  adminApi: {
    topics: vi.fn(async () => [{ id: 1, name: "Spring Boot", slug: "spring-boot", description: "Backend", sortOrder: 0 }]),
    saveTopic: vi.fn(async () => ({ id: 1, name: "Spring Boot", slug: "spring-boot", description: "Backend", sortOrder: 0 })),
    deleteTopic: vi.fn(async () => undefined)
  }
}));

describe("TopicsView", () => {
  it("loads and renders topics", async () => {
    const wrapper = mount(TopicsView, { global: { plugins: [ElementPlus] } });
    await vi.dynamicImportSettled();

    expect(wrapper.text()).toContain("Spring Boot");
    expect(wrapper.text()).toContain("spring-boot");
  });
});
```

Create `frontend/apps/admin/src/views/SeriesView.test.ts`:

```ts
import { mount } from "@vue/test-utils";
import ElementPlus from "element-plus";
import { describe, expect, it, vi } from "vitest";
import SeriesView from "./SeriesView.vue";

vi.mock("../lib/api", () => ({
  adminApi: {
    topics: vi.fn(async () => [{ id: 1, name: "Spring Boot", slug: "spring-boot", description: "Backend", sortOrder: 0 }]),
    series: vi.fn(async () => [{
      id: 2,
      name: "Build Blog",
      slug: "build-blog",
      description: "Project",
      primaryTopic: { id: 1, name: "Spring Boot", slug: "spring-boot" },
      sortOrder: 0
    }]),
    saveSeries: vi.fn(async () => ({ id: 2, name: "Build Blog", slug: "build-blog", description: "Project", primaryTopic: null, sortOrder: 0 })),
    deleteSeries: vi.fn(async () => undefined)
  }
}));

describe("SeriesView", () => {
  it("loads series and primary topic options", async () => {
    const wrapper = mount(SeriesView, { global: { plugins: [ElementPlus] } });
    await vi.dynamicImportSettled();

    expect(wrapper.text()).toContain("Build Blog");
    expect(wrapper.text()).toContain("Spring Boot");
  });
});
```

- [ ] **Step 2: Run admin view tests to verify failure**

Run from `frontend`:

```powershell
corepack pnpm --filter @blog/admin test -- TopicsView.test.ts SeriesView.test.ts
```

Expected: FAIL because the views do not exist.

- [ ] **Step 3: Add `TopicsView.vue`**

Create `frontend/apps/admin/src/views/TopicsView.vue`:

```vue
<template>
  <CrudPanel
    title="专题"
    :rows="rows"
    :fields="fields"
    :save-row="save"
    :delete-row="remove"
  />
</template>

<script setup lang="ts">
import type { Topic, TopicInput } from "@blog/shared";
import { onMounted, ref } from "vue";
import CrudPanel from "../components/CrudPanel.vue";
import { adminApi } from "../lib/api";

const rows = ref<Topic[]>([]);
const fields = [
  { key: "name", label: "名称" },
  { key: "slug", label: "URL 标识" },
  { key: "description", label: "描述" },
  { key: "sortOrder", label: "排序" }
];

async function load() {
  rows.value = await adminApi.topics();
}

async function save(row: Record<string, unknown>) {
  const sortOrder = Number(row.sortOrder);
  await adminApi.saveTopic({
    ...row,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0
  } as Partial<TopicInput> & { id?: number });
  await load();
}

async function remove(id: number) {
  await adminApi.deleteTopic(id);
  await load();
}

onMounted(load);
</script>
```

- [ ] **Step 4: Add `SeriesView.vue`**

Create `frontend/apps/admin/src/views/SeriesView.vue`:

```vue
<template>
  <section class="panel">
    <div class="page-head">
      <h1>系列</h1>
      <el-button type="danger" @click="open({})">新建</el-button>
    </div>
    <el-alert v-if="error" type="error" :title="error" :closable="false" />
    <el-table :data="rows" border>
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="slug" label="URL 标识" />
      <el-table-column label="主专题">
        <template #default="{ row }">{{ row.primaryTopic?.name ?? "未关联" }}</template>
      </el-table-column>
      <el-table-column prop="sortOrder" label="排序" width="90" />
      <el-table-column label="操作" width="170">
        <template #default="{ row }">
          <el-button size="small" @click="open(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="remove(Number(row.id))">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" title="系列" width="560">
      <el-form label-position="top">
        <el-form-item label="名称"><el-input v-model="draft.name" /></el-form-item>
        <el-form-item label="URL 标识"><el-input v-model="draft.slug" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="draft.description" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="主专题">
          <el-select v-model="draft.primaryTopicId" clearable>
            <el-option v-for="topic in topics" :key="topic.id" :label="topic.name" :value="topic.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序"><el-input v-model="draft.sortOrder" /></el-form-item>
        <el-alert v-if="dialogError" type="error" :title="dialogError" :closable="false" />
        <el-button type="danger" :loading="saving" @click="submit">保存</el-button>
      </el-form>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import type { Series, SeriesInput, Topic } from "@blog/shared";
import { reactive, ref, onMounted } from "vue";
import { adminApi } from "../lib/api";

const rows = ref<Series[]>([]);
const topics = ref<Topic[]>([]);
const visible = ref(false);
const saving = ref(false);
const error = ref("");
const dialogError = ref("");
const draft = reactive<Record<string, unknown>>({});

async function load() {
  const [loadedSeries, loadedTopics] = await Promise.all([adminApi.series(), adminApi.topics()]);
  rows.value = loadedSeries;
  topics.value = loadedTopics;
}

function open(row: Partial<Series>) {
  Object.keys(draft).forEach((key) => delete draft[key]);
  Object.assign(draft, row, { primaryTopicId: row.primaryTopic?.id ?? null });
  visible.value = true;
  error.value = "";
  dialogError.value = "";
}

async function submit() {
  dialogError.value = "";
  saving.value = true;
  try {
    const sortOrder = Number(draft.sortOrder);
    await adminApi.saveSeries({
      ...draft,
      primaryTopicId: draft.primaryTopicId === "" ? null : draft.primaryTopicId,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0
    } as Partial<SeriesInput> & { id?: number });
    visible.value = false;
    await load();
  } catch (err) {
    dialogError.value = err instanceof Error ? err.message : "保存失败，请稍后重试";
  } finally {
    saving.value = false;
  }
}

async function remove(id: number) {
  error.value = "";
  try {
    await adminApi.deleteSeries(id);
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "删除失败，请先检查是否有关联文章";
  }
}

onMounted(load);
</script>
```

- [ ] **Step 5: Add routes and sidebar links**

Modify `frontend/apps/admin/src/router/index.ts` routes:

```ts
{ path: "/topics", component: () => import("../views/TopicsView.vue") },
{ path: "/series", component: () => import("../views/SeriesView.vue") },
```

Modify `frontend/apps/admin/src/App.vue` sidebar:

```vue
<RouterLink to="/topics">专题</RouterLink>
<RouterLink to="/series">系列</RouterLink>
```

Place these links near categories and tags.

- [ ] **Step 6: Run admin view tests**

Run from `frontend`:

```powershell
corepack pnpm --filter @blog/admin test -- TopicsView.test.ts SeriesView.test.ts App.test.ts router/index.test.ts
```

Expected: PASS after updating assertions in `App.test.ts` and `router/index.test.ts` to include `/topics` and `/series`.

- [ ] **Step 7: Commit admin management screens**

```powershell
git add frontend\apps\admin\src\views\TopicsView.vue frontend\apps\admin\src\views\TopicsView.test.ts frontend\apps\admin\src\views\SeriesView.vue frontend\apps\admin\src\views\SeriesView.test.ts frontend\apps\admin\src\router\index.ts frontend\apps\admin\src\router\index.test.ts frontend\apps\admin\src\App.vue frontend\apps\admin\src\App.test.ts
git commit -m "feat: manage topics and series in admin"
```

## Task 7: Admin Post Editor Topic And Series Fields

**Files:**

- Modify: `frontend/apps/admin/src/features/posts/postForm.ts`
- Modify: `frontend/apps/admin/src/features/posts/postForm.test.ts`
- Modify: `frontend/apps/admin/src/views/PostPublishPanel.vue`
- Modify: `frontend/apps/admin/src/views/PostPublishPanel.test.ts`
- Modify: `frontend/apps/admin/src/views/PostEditorView.vue`
- Modify: `frontend/apps/admin/src/views/PostEditorView.test.ts`

- [ ] **Step 1: Write failing post form tests**

Add to `frontend/apps/admin/src/features/posts/postForm.test.ts`:

```ts
it("serializes topic and series fields for post submit", () => {
  expect(toPostInput({
    title: "Series post",
    slug: "series-post",
    contentHtml: "<p>Body</p>",
    status: "PUBLISHED",
    categoryId: null,
    tagIds: [],
    topicIds: [1, 2],
    seriesId: 3,
    seriesOrder: 4
  })).toMatchObject({
    topicIds: [1, 2],
    seriesId: 3,
    seriesOrder: 4
  });
});

it("requires a positive series order when a series is selected", () => {
  expect(validatePostForm({
    title: "Series post",
    slug: "series-post",
    status: "PUBLISHED",
    tagIds: [],
    topicIds: [],
    seriesId: 3,
    seriesOrder: null
  })).toContain("请选择系列序号");
});
```

- [ ] **Step 2: Run post form tests to verify failure**

Run from `frontend`:

```powershell
corepack pnpm --filter @blog/admin test -- postForm.test.ts
```

Expected: FAIL because `PostForm`, `toPostInput`, and validation do not include topic and series fields.

- [ ] **Step 3: Extend `postForm.ts`**

Modify `PostForm`:

```ts
export type PostForm = Partial<PostInput> & {
  title?: string;
  slug?: string;
  tagIds: number[];
  topicIds: number[];
};
```

Add series validation:

```ts
if (form.seriesId !== null && form.seriesId !== undefined && (!form.seriesOrder || form.seriesOrder < 1)) {
  errors.push("请选择系列序号");
}
```

Extend `toPostInput`:

```ts
topicIds: form.topicIds ?? [],
seriesId: form.seriesId ?? null,
seriesOrder: form.seriesId === null || form.seriesId === undefined ? null : form.seriesOrder ?? null,
```

Extend `postFormSnapshot`:

```ts
topicIds: [...(form.topicIds ?? [])].sort((left, right) => left - right),
seriesId: form.seriesId ?? null,
seriesOrder: form.seriesId === null || form.seriesId === undefined ? null : form.seriesOrder ?? null,
```

- [ ] **Step 4: Extend publish panel tests**

Modify `frontend/apps/admin/src/views/PostPublishPanel.test.ts` setup:

```ts
const topics: Topic[] = [{ id: 3, name: "Spring Boot", slug: "spring-boot", sortOrder: 0 }];
const series: Series[] = [{
  id: 4,
  name: "Build Blog",
  slug: "build-blog",
  description: "Project",
  primaryTopic: { id: 3, name: "Spring Boot", slug: "spring-boot" },
  sortOrder: 0
}];
```

Pass `topics` and `series` to `mountPanel`.

Add assertions:

```ts
expect(wrapper.text()).toContain("专题");
expect(wrapper.text()).toContain("系列");
```

Emit updates:

```ts
await wrapper.findComponent({ name: "ElInputNumber" }).vm.$emit("update:modelValue", 2);
expect(wrapper.emitted("update:form")?.at(-1)).toEqual([{ ...form, seriesOrder: 2 }]);
```

- [ ] **Step 5: Extend `PostPublishPanel.vue` props and fields**

Modify imports:

```ts
import type { Category, MediaAsset, Series, Tag, Topic } from "@blog/shared";
```

Add props:

```ts
topics: Topic[];
series: Series[];
```

Add fields after category and before tags:

```vue
<el-form-item label="专题">
  <el-select
    :model-value="form.topicIds"
    multiple
    @update:model-value="updateField('topicIds', $event)"
  >
    <el-option v-for="topic in topics" :key="topic.id" :label="topic.name" :value="topic.id" />
  </el-select>
</el-form-item>

<el-form-item label="系列">
  <el-select
    :model-value="form.seriesId"
    clearable
    @update:model-value="updateField('seriesId', $event)"
  >
    <el-option v-for="item in series" :key="item.id" :label="item.name" :value="item.id" />
  </el-select>
</el-form-item>

<el-form-item v-if="form.seriesId" label="系列序号">
  <el-input-number
    :model-value="form.seriesOrder ?? 1"
    :min="1"
    @update:model-value="updateField('seriesOrder', $event ?? null)"
  />
</el-form-item>
```

- [ ] **Step 6: Extend `PostEditorView.vue` data loading and form defaults**

Add imports:

```ts
import type { Series, Topic } from "@blog/shared";
```

Add refs:

```ts
const topics = ref<Topic[]>([]);
const series = ref<Series[]>([]);
```

Extend default form:

```ts
topicIds: [],
seriesId: null,
seriesOrder: null
```

Pass to `PostPublishPanel`:

```vue
:topics="topics"
:series="series"
```

Load with existing metadata:

```ts
const [loadedCategories, loadedTags, loadedMedia, loadedTopics, loadedSeries] = await Promise.all([
  adminApi.categories(),
  adminApi.tags(),
  adminApi.media(),
  adminApi.topics(),
  adminApi.series()
]);
topics.value = loadedTopics;
series.value = loadedSeries;
```

When loading an existing post, map response fields:

```ts
topicIds: post.topics?.map((topic) => topic.id) ?? [],
seriesId: post.series?.id ?? null,
seriesOrder: post.seriesOrder ?? null
```

- [ ] **Step 7: Run focused admin post editor tests**

Run from `frontend`:

```powershell
corepack pnpm --filter @blog/admin test -- postForm.test.ts PostPublishPanel.test.ts PostEditorView.test.ts
```

Expected: PASS after updating mocks to return `topics()` and `series()`.

- [ ] **Step 8: Commit post editor integration**

```powershell
git add frontend\apps\admin\src\features\posts\postForm.ts frontend\apps\admin\src\features\posts\postForm.test.ts frontend\apps\admin\src\views\PostPublishPanel.vue frontend\apps\admin\src\views\PostPublishPanel.test.ts frontend\apps\admin\src\views\PostEditorView.vue frontend\apps\admin\src\views\PostEditorView.test.ts
git commit -m "feat: assign posts to topics and series"
```

## Task 8: Public Topic And Series Pages

**Files:**

- Create: `frontend/apps/web/src/views/TopicIndexView.vue`
- Create: `frontend/apps/web/src/views/TopicDetailView.vue`
- Create: `frontend/apps/web/src/views/SeriesIndexView.vue`
- Create: `frontend/apps/web/src/views/SeriesDetailView.vue`
- Create: `frontend/apps/web/src/views/TopicIndexView.test.ts`
- Create: `frontend/apps/web/src/views/TopicDetailView.test.ts`
- Create: `frontend/apps/web/src/views/SeriesIndexView.test.ts`
- Create: `frontend/apps/web/src/views/SeriesDetailView.test.ts`
- Modify: `frontend/apps/web/src/router/index.ts`
- Modify: `frontend/apps/web/src/router/index.test.ts`
- Modify: `frontend/apps/web/src/App.vue`
- Modify: `frontend/apps/web/src/App.test.ts`
- Modify: `frontend/apps/web/src/styles.css`

- [ ] **Step 1: Write failing public route test**

Modify `frontend/apps/web/src/router/index.test.ts`:

```ts
it("includes topic and series routes", () => {
  expect(router.getRoutes().map((route) => route.path)).toEqual(expect.arrayContaining([
    "/topics",
    "/topics/:slug",
    "/series",
    "/series/:slug"
  ]));
});
```

- [ ] **Step 2: Write failing page tests**

Create `frontend/apps/web/src/views/TopicIndexView.test.ts`:

```ts
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import TopicIndexView from "./TopicIndexView.vue";

vi.mock("../lib/api", () => ({
  publicApi: {
    topics: vi.fn(async () => [{ id: 1, name: "Spring Boot", slug: "spring-boot", description: "Backend", sortOrder: 0 }])
  }
}));

describe("TopicIndexView", () => {
  it("renders public topics", async () => {
    const wrapper = mount(TopicIndexView, {
      global: { stubs: { RouterLink: true } }
    });
    await vi.dynamicImportSettled();

    expect(wrapper.text()).toContain("Spring Boot");
    expect(wrapper.text()).toContain("Backend");
  });
});
```

Create the other three tests with the same pattern:

```ts
expect(wrapper.text()).toContain("Build Blog");
expect(wrapper.text()).toContain("JWT Login");
```

- [ ] **Step 3: Run public page tests to verify failure**

Run from `frontend`:

```powershell
corepack pnpm --filter @blog/web test -- TopicIndexView.test.ts TopicDetailView.test.ts SeriesIndexView.test.ts SeriesDetailView.test.ts router/index.test.ts
```

Expected: FAIL because routes and views do not exist.

- [ ] **Step 4: Add topic index view**

Create `frontend/apps/web/src/views/TopicIndexView.vue`:

```vue
<template>
  <main class="content-band knowledge-index">
    <div class="section-head">
      <h1>专题</h1>
      <p>按长期技术主题浏览文章。</p>
    </div>
    <div v-if="topics.length" class="knowledge-grid">
      <RouterLink v-for="topic in topics" :key="topic.id" class="knowledge-card" :to="`/topics/${topic.slug}`">
        <strong>{{ topic.name }}</strong>
        <span>{{ topic.description || "暂无描述" }}</span>
      </RouterLink>
    </div>
    <EmptyState v-else title="暂无专题" />
  </main>
</template>

<script setup lang="ts">
import type { Topic } from "@blog/shared";
import { onMounted, ref } from "vue";
import EmptyState from "../components/EmptyState.vue";
import { publicApi } from "../lib/api";

const topics = ref<Topic[]>([]);

onMounted(async () => {
  try {
    topics.value = await publicApi.topics();
  } catch {
    topics.value = [];
  }
});
</script>
```

- [ ] **Step 5: Add topic detail view**

Create `frontend/apps/web/src/views/TopicDetailView.vue`:

```vue
<template>
  <main class="content-band knowledge-detail">
    <div class="section-head">
      <div>
        <h1>{{ detail?.topic.name ?? slug }}</h1>
        <p>{{ detail?.topic.description }}</p>
      </div>
    </div>

    <section v-if="detail?.relatedSeries.length" class="related-series">
      <h2>相关系列</h2>
      <RouterLink v-for="item in detail.relatedSeries" :key="item.id" :to="`/series/${item.slug}`">
        {{ item.name }}
      </RouterLink>
    </section>

    <div v-if="detail?.posts.length" class="post-grid">
      <PostCard v-for="post in detail.posts" :key="post.id" :post="post" />
    </div>
    <EmptyState v-else title="这个专题还没有文章" />
  </main>
</template>

<script setup lang="ts">
import type { TopicDetail } from "@blog/shared";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import EmptyState from "../components/EmptyState.vue";
import PostCard from "../components/PostCard.vue";
import { publicApi } from "../lib/api";

const route = useRoute();
const slug = String(route.params.slug);
const detail = ref<TopicDetail | null>(null);

onMounted(async () => {
  try {
    detail.value = await publicApi.topic(slug);
  } catch {
    detail.value = null;
  }
});
</script>
```

- [ ] **Step 6: Add series index and detail views**

Create `frontend/apps/web/src/views/SeriesIndexView.vue`:

```vue
<template>
  <main class="content-band knowledge-index">
    <div class="section-head">
      <h1>系列</h1>
      <p>按顺序阅读完整技术路径。</p>
    </div>
    <div v-if="series.length" class="knowledge-grid">
      <RouterLink v-for="item in series" :key="item.id" class="knowledge-card" :to="`/series/${item.slug}`">
        <strong>{{ item.name }}</strong>
        <span>{{ item.description || "暂无描述" }}</span>
        <em v-if="item.primaryTopic">{{ item.primaryTopic.name }}</em>
      </RouterLink>
    </div>
    <EmptyState v-else title="暂无系列" />
  </main>
</template>

<script setup lang="ts">
import type { Series } from "@blog/shared";
import { onMounted, ref } from "vue";
import EmptyState from "../components/EmptyState.vue";
import { publicApi } from "../lib/api";

const series = ref<Series[]>([]);

onMounted(async () => {
  try {
    series.value = await publicApi.seriesList();
  } catch {
    series.value = [];
  }
});
</script>
```

Create `frontend/apps/web/src/views/SeriesDetailView.vue`:

```vue
<template>
  <main class="content-band knowledge-detail">
    <div class="section-head">
      <div>
        <h1>{{ detail?.series.name ?? slug }}</h1>
        <p>{{ detail?.series.description }}</p>
      </div>
      <RouterLink v-if="detail?.series.primaryTopic" :to="`/topics/${detail.series.primaryTopic.slug}`">
        {{ detail.series.primaryTopic.name }}
      </RouterLink>
    </div>

    <ol v-if="detail?.posts.length" class="series-post-list">
      <li v-for="post in detail.posts" :key="post.id">
        <span>{{ post.seriesOrder }}</span>
        <RouterLink :to="`/posts/${post.slug}`">{{ post.title }}</RouterLink>
        <p v-if="post.summary">{{ post.summary }}</p>
      </li>
    </ol>
    <EmptyState v-else title="这个系列还没有文章" />
  </main>
</template>

<script setup lang="ts">
import type { SeriesDetail } from "@blog/shared";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import EmptyState from "../components/EmptyState.vue";
import { publicApi } from "../lib/api";

const route = useRoute();
const slug = String(route.params.slug);
const detail = ref<SeriesDetail | null>(null);

onMounted(async () => {
  try {
    detail.value = await publicApi.series(slug);
  } catch {
    detail.value = null;
  }
});
</script>
```

- [ ] **Step 7: Add routes and masthead links**

Modify `frontend/apps/web/src/router/index.ts`:

```ts
import TopicIndexView from "../views/TopicIndexView.vue";
import TopicDetailView from "../views/TopicDetailView.vue";
import SeriesIndexView from "../views/SeriesIndexView.vue";
import SeriesDetailView from "../views/SeriesDetailView.vue";
```

Add routes:

```ts
{ path: "/topics", component: TopicIndexView },
{ path: "/topics/:slug", component: TopicDetailView },
{ path: "/series", component: SeriesIndexView },
{ path: "/series/:slug", component: SeriesDetailView },
```

Modify `frontend/apps/web/src/App.vue`:

```vue
<RouterLink to="/topics">专题</RouterLink>
<RouterLink to="/series">系列</RouterLink>
```

- [ ] **Step 8: Add minimal styles**

Append to `frontend/apps/web/src/styles.css`:

```css
.knowledge-index,
.knowledge-detail {
  display: grid;
  gap: 28px;
}

.knowledge-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.knowledge-card,
.related-series a,
.series-post-list li {
  background: var(--paper-soft);
  border: 2px solid var(--ink);
  box-shadow: 5px 5px 0 rgba(17, 16, 13, 0.18);
  color: var(--ink);
  display: grid;
  gap: 8px;
  padding: 16px;
}

.knowledge-card strong {
  font-family: "Archivo Black", "Arial Black", sans-serif;
  font-size: 20px;
}

.knowledge-card em {
  color: var(--blue);
  font-style: normal;
  font-weight: 800;
}

.related-series {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.related-series h2 {
  flex-basis: 100%;
  margin: 0;
}

.series-post-list {
  display: grid;
  gap: 14px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.series-post-list span {
  color: var(--red);
  font-family: "IBM Plex Mono", monospace;
  font-weight: 900;
}
```

- [ ] **Step 9: Run public topic/series tests**

Run from `frontend`:

```powershell
corepack pnpm --filter @blog/web test -- TopicIndexView.test.ts TopicDetailView.test.ts SeriesIndexView.test.ts SeriesDetailView.test.ts App.test.ts router/index.test.ts
```

Expected: PASS after updating app/router expectations for the new navigation links and routes.

- [ ] **Step 10: Commit public pages**

```powershell
git add frontend\apps\web\src\views\TopicIndexView.vue frontend\apps\web\src\views\TopicIndexView.test.ts frontend\apps\web\src\views\TopicDetailView.vue frontend\apps\web\src\views\TopicDetailView.test.ts frontend\apps\web\src\views\SeriesIndexView.vue frontend\apps\web\src\views\SeriesIndexView.test.ts frontend\apps\web\src\views\SeriesDetailView.vue frontend\apps\web\src\views\SeriesDetailView.test.ts frontend\apps\web\src\router\index.ts frontend\apps\web\src\router\index.test.ts frontend\apps\web\src\App.vue frontend\apps\web\src\App.test.ts frontend\apps\web\src\styles.css
git commit -m "feat: add public topic and series pages"
```

## Task 9: Public Article And Archive Integration

**Files:**

- Modify: `frontend/apps/web/src/views/PostDetailView.vue`
- Modify: `frontend/apps/web/src/views/PostDetailView.test.ts`
- Modify: `frontend/apps/web/src/components/ArchiveFilters.vue`
- Modify: `frontend/apps/web/src/components/ArchiveFilters.test.ts`
- Modify: `frontend/apps/web/src/views/ArchiveView.vue`
- Modify: `frontend/apps/web/src/views/ArchiveView.test.ts`
- Modify: `frontend/apps/web/src/components/ArchivePostList.vue`
- Modify: `frontend/apps/web/src/components/ArchivePostList.test.ts`
- Modify: `frontend/apps/web/src/styles.css`

- [ ] **Step 1: Add failing article detail expectations**

Modify `frontend/apps/web/src/views/PostDetailView.test.ts` mock post:

```ts
topics: [{ id: 3, name: "Spring Boot", slug: "spring-boot" }],
series: { id: 4, name: "Build Blog", slug: "build-blog", primaryTopic: { id: 3, name: "Spring Boot", slug: "spring-boot" } },
seriesOrder: 2,
previousSeriesPost: { id: 10, title: "Part One", slug: "part-one", seriesOrder: 1 },
nextSeriesPost: { id: 12, title: "Part Three", slug: "part-three", seriesOrder: 3 },
```

Add assertions:

```ts
expect(wrapper.text()).toContain("Spring Boot");
expect(wrapper.text()).toContain("Build Blog");
expect(wrapper.text()).toContain("Part One");
expect(wrapper.text()).toContain("Part Three");
```

- [ ] **Step 2: Extend `PostDetailView.vue`**

In article taxonomy, add topics:

```vue
<RouterLink v-for="topic in post.topics ?? []" :key="topic.id" :to="`/topics/${topic.slug}`">{{ topic.name }}</RouterLink>
```

Add series block below article layout and before interactions:

```vue
<nav v-if="post.series" class="series-navigation" aria-label="系列导航">
  <RouterLink class="series-navigation-title" :to="`/series/${post.series.slug}`">
    {{ post.series.name }} / {{ post.seriesOrder }}
  </RouterLink>
  <div>
    <RouterLink v-if="post.previousSeriesPost" :to="`/posts/${post.previousSeriesPost.slug}`">
      上一篇：{{ post.previousSeriesPost.title }}
    </RouterLink>
    <RouterLink v-if="post.nextSeriesPost" :to="`/posts/${post.nextSeriesPost.slug}`">
      下一篇：{{ post.nextSeriesPost.title }}
    </RouterLink>
  </div>
</nav>
```

- [ ] **Step 3: Add failing archive filter expectations**

Modify `frontend/apps/web/src/components/ArchiveFilters.test.ts` props to include:

```ts
topics: [{ id: 3, name: "Spring Boot", slug: "spring-boot", sortOrder: 0 }],
series: [{ id: 4, name: "Build Blog", slug: "build-blog", description: "Project", primaryTopic: null, sortOrder: 0 }],
```

Expect emitted search payload:

```ts
expect(wrapper.emitted("search")?.[0][0]).toMatchObject({
  topic: "spring-boot",
  series: "build-blog"
});
```

- [ ] **Step 4: Extend archive filters and view**

Modify `frontend/apps/web/src/components/ArchiveFilters.vue` props:

```ts
topics: Topic[];
series: Series[];
```

Extend filter state with:

```ts
topic: string;
series: string;
```

Add selects:

```vue
<label v-if="taxonomyAvailable">
  <span>专题</span>
  <select v-model="draft.topic">
    <option value="">全部专题</option>
    <option v-for="topic in topics" :key="topic.id" :value="topic.slug">{{ topic.name }}</option>
  </select>
</label>

<label v-if="taxonomyAvailable">
  <span>系列</span>
  <select v-model="draft.series">
    <option value="">全部系列</option>
    <option v-for="item in series" :key="item.id" :value="item.slug">{{ item.name }}</option>
  </select>
</label>
```

Modify `frontend/apps/web/src/views/ArchiveView.vue`:

```ts
const topics = ref<Topic[]>([]);
const series = ref<Series[]>([]);
```

Load taxonomy:

```ts
const [loadedCategories, loadedTags, loadedTopics, loadedSeries] = await Promise.all([
  publicApi.categories(),
  publicApi.tags(),
  publicApi.topics(),
  publicApi.seriesList()
]);
topics.value = loadedTopics;
series.value = loadedSeries;
```

Include `topic` and `series` in `filterState`, `activeParams`, `resetFilters`, and route query restoration.

- [ ] **Step 5: Show topics and series in archive list entries**

Modify `frontend/apps/web/src/components/ArchivePostList.vue` metadata:

```vue
<RouterLink v-if="post.series" :to="`/series/${post.series.slug}`">{{ post.series.name }}</RouterLink>
<RouterLink v-for="topic in post.topics ?? []" :key="topic.id" :to="`/topics/${topic.slug}`">{{ topic.name }}</RouterLink>
```

- [ ] **Step 6: Add styles**

Append to `frontend/apps/web/src/styles.css`:

```css
.series-navigation {
  background: var(--paper-soft);
  border: 2px solid var(--ink);
  box-shadow: 6px 6px 0 rgba(17, 16, 13, 0.18);
  display: grid;
  gap: 12px;
  margin: 0 auto 28px;
  max-width: 1100px;
  padding: 18px;
}

.series-navigation-title {
  color: var(--red);
  font-family: "Archivo Black", "Arial Black", sans-serif;
}

.series-navigation div {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
```

- [ ] **Step 7: Run focused public integration tests**

Run from `frontend`:

```powershell
corepack pnpm --filter @blog/web test -- PostDetailView.test.ts ArchiveFilters.test.ts ArchiveView.test.ts ArchivePostList.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit public integration**

```powershell
git add frontend\apps\web\src\views\PostDetailView.vue frontend\apps\web\src\views\PostDetailView.test.ts frontend\apps\web\src\components\ArchiveFilters.vue frontend\apps\web\src\components\ArchiveFilters.test.ts frontend\apps\web\src\views\ArchiveView.vue frontend\apps\web\src\views\ArchiveView.test.ts frontend\apps\web\src\components\ArchivePostList.vue frontend\apps\web\src\components\ArchivePostList.test.ts frontend\apps\web\src\styles.css
git commit -m "feat: surface topics and series in public reading"
```

## Task 10: Full Verification And Release Notes

**Files:**

- Modify: `docs/PROJECT_STRUCTURE.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Update project structure docs**

Modify `docs/PROJECT_STRUCTURE.md` backend section to mention:

```markdown
- `src/main/java/com/example/blog/topic/`: flat public knowledge topics and admin topic management API.
- `src/main/java/com/example/blog/series/`: ordered reading series with optional primary topic links.
```

Modify frontend sections:

```markdown
- Public site includes topic and series index/detail pages for long-lived technical knowledge structure.
- Admin site includes topic and series management plus post-level topic and series assignment.
```

- [ ] **Step 2: Update changelog**

Add unreleased entry at top of `CHANGELOG.md`:

```markdown
## 1.2.0 - Unreleased

- Add flat topics for durable technical knowledge maps.
- Add ordered series for sequential article reading paths.
- Extend article editing, public archive filtering, and article detail pages with topic and series metadata.
```

- [ ] **Step 3: Run backend full tests**

Run from repository root:

```powershell
cd backend
.\mvnw.cmd test
cd ..
```

Expected: PASS.

- [ ] **Step 4: Run frontend full tests**

Run from repository root:

```powershell
corepack pnpm --dir frontend test
```

Expected: PASS.

- [ ] **Step 5: Run frontend build**

Run from repository root:

```powershell
corepack pnpm --dir frontend build
```

Expected: PASS.

- [ ] **Step 6: Run deployment config validation**

Run from repository root:

```powershell
docker compose -f deploy/docker-compose.yml --env-file deploy/.env.example config
```

Expected: PASS and render a valid compose configuration.

- [ ] **Step 7: Commit docs and verification state**

```powershell
git add docs\PROJECT_STRUCTURE.md CHANGELOG.md
git commit -m "docs: document topic and series release scope"
```

- [ ] **Step 8: Final working tree check**

Run:

```powershell
git status --short --branch
```

Expected: no uncommitted files related to this implementation.

## Plan Self-Review

Spec coverage:

- Category remains unchanged and is covered by compatibility/regression verification.
- Topic model, public topic pages, and admin topic management are covered by Tasks 1, 2, 5, 6, and 8.
- Series model, optional primary topic, ordered posts, and previous/next navigation are covered by Tasks 1, 3, 4, 5, 7, 8, and 9.
- Tag behavior remains unchanged and is covered by archive/article regression tests.
- Search filters for topic and series are covered by Tasks 4, 5, and 9.
- Migration and compatibility are covered by Tasks 1 and 10.

Red-flag token scan:

- No incomplete markers are intentionally left in this plan.
- Every task has concrete files, commands, expected outcomes, and a commit point.

Type consistency:

- Backend uses `Topic`, `Series`, `topicIds`, `seriesId`, and `seriesOrder`.
- Frontend shared types use the same `topicIds`, `seriesId`, `seriesOrder`, `previousSeriesPost`, and `nextSeriesPost` names.
- Public API method names distinguish `seriesList()` from `series(slug)` to avoid an object key collision.
