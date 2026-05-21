# Archive Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `/archive` into a backend-backed article discovery page with keyword, year, category, tag, sorting, pagination, URL-synced filters, and dense article list rendering.

**Architecture:** Add a public `/api/v1/posts/search` endpoint inside the existing post module and implement optional filters with Spring Data JPA `Specification`. On the frontend, add `publicApi.searchPosts`, split archive UI into filter/list/pagination components, and keep `ArchiveView.vue` as the route orchestrator for URL query state and data loading.

**Tech Stack:** Java 21, Spring Boot 3.3, Spring Data JPA, MockMvc, Vue 3, Vue Router, TypeScript, Vitest, Vue Test Utils, existing `@blog/shared` DTOs.

---

## File Structure

- Modify `backend/src/main/java/com/example/blog/post/PostRepository.java`: extend `JpaSpecificationExecutor<Post>` so optional filters can compose cleanly.
- Modify `backend/src/main/java/com/example/blog/post/PostDtos.java`: add generic `PageResponse<T>` and `PostSearchRequest` records used by the public search endpoint.
- Modify `backend/src/main/java/com/example/blog/post/PostService.java`: add `search(PostSearchRequest)` with paging, sort fallback, year range, keyword, category, and tag filtering.
- Modify `backend/src/main/java/com/example/blog/post/PostController.java`: expose `GET /api/v1/posts/search`.
- Create `backend/src/test/java/com/example/blog/content/PostSearchControllerTest.java`: integration coverage for published-only visibility, keyword/year/taxonomy filters, combined filters, pagination, and sort fallback.
- Modify `frontend/apps/web/src/lib/api.ts`: add `PostSearchParams`, `cleanPostSearchParams`, and `publicApi.searchPosts`.
- Create `frontend/apps/web/src/lib/api.test.ts`: verify query generation and empty-value omission.
- Create `frontend/apps/web/src/components/ArchiveFilters.vue`: controlled filter form with search/reset events.
- Create `frontend/apps/web/src/components/ArchiveFilters.test.ts`: verify events and form rendering.
- Create `frontend/apps/web/src/components/ArchivePostList.vue`: dense public article list.
- Create `frontend/apps/web/src/components/ArchivePostList.test.ts`: verify metadata, thumbnail, links, and empty state.
- Create `frontend/apps/web/src/components/PaginationControls.vue`: small previous/next pager.
- Create `frontend/apps/web/src/components/PaginationControls.test.ts`: verify disabled states and emitted page numbers.
- Modify `frontend/apps/web/src/views/ArchiveView.vue`: replace month-grouped API use with search results, URL query restoration, filters, pagination, and error handling.
- Modify `frontend/apps/web/src/views/ArchiveView.test.ts`: replace old archive grouping expectations with discovery-page behavior tests.
- Modify `frontend/apps/web/src/styles.css`: add archive discovery layout, filter controls, dense list, pager, error state, and mobile styles.

## Commands

Use these commands from `D:\work\demo\blog`:

- Backend search tests: `cd backend; .\mvnw.cmd test -Dtest=PostSearchControllerTest`
- Backend full tests: `cd backend; .\mvnw.cmd test`
- Web tests: `node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web test`
- Web build: `node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web build`

---

### Task 1: Add Backend Search Contract Tests

**Files:**
- Create: `backend/src/test/java/com/example/blog/content/PostSearchControllerTest.java`
- Later modify: `backend/src/main/java/com/example/blog/post/PostController.java`
- Later modify: `backend/src/main/java/com/example/blog/post/PostService.java`
- Later modify: `backend/src/main/java/com/example/blog/post/PostRepository.java`
- Later modify: `backend/src/main/java/com/example/blog/post/PostDtos.java`

- [ ] **Step 1: Write failing search endpoint tests**

Create `backend/src/test/java/com/example/blog/content/PostSearchControllerTest.java` with:

```java
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
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Set;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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

  Category engineering;
  Category notes;
  Tag vue;
  Tag java;

  @BeforeEach
  void setUp() {
    posts.deleteAll();
    tags.deleteAll();
    categories.deleteAll();

    engineering = categories.save(new Category("Engineering", "engineering", "", 0));
    notes = categories.save(new Category("Notes", "notes", "", 1));
    vue = tags.save(new Tag("Vue", "vue"));
    java = tags.save(new Tag("Java", "java"));

    published("Vue Reading", "vue-reading", "Frontend summary", "<p>Composition API guide</p>",
        engineering, Set.of(vue), "2026-05-20T00:00:00Z");
    published("Spring Search", "spring-search", "Backend summary", "<p>Criteria query guide</p>",
        engineering, Set.of(java), "2025-04-10T00:00:00Z");
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
        .andExpect(jsonPath("$.content").value(not(containsString("Draft Search"))));
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
```

- [ ] **Step 2: Run backend search tests and verify they fail**

Run:

```powershell
cd backend
.\mvnw.cmd test -Dtest=PostSearchControllerTest
```

Expected result: FAIL with 404 responses for `/api/v1/posts/search`, because the endpoint does not exist yet.

- [ ] **Step 3: Commit the failing backend contract tests**

Run:

```powershell
git add backend/src/test/java/com/example/blog/content/PostSearchControllerTest.java
git commit -m "Add public post search contract tests"
```

---

### Task 2: Implement Backend Public Post Search

**Files:**
- Modify: `backend/src/main/java/com/example/blog/post/PostRepository.java`
- Modify: `backend/src/main/java/com/example/blog/post/PostDtos.java`
- Modify: `backend/src/main/java/com/example/blog/post/PostService.java`
- Modify: `backend/src/main/java/com/example/blog/post/PostController.java`
- Test: `backend/src/test/java/com/example/blog/content/PostSearchControllerTest.java`

- [ ] **Step 1: Enable specifications in the repository**

Modify `backend/src/main/java/com/example/blog/post/PostRepository.java` so the interface declaration and imports are:

```java
package com.example.blog.post;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long>, JpaSpecificationExecutor<Post> {

  @EntityGraph(attributePaths = {"category", "tags"})
  List<Post> findByStatusOrderByPublishedAtDescCreatedAtDesc(PostStatus status);

  @EntityGraph(attributePaths = {"category", "tags"})
  Optional<Post> findBySlugAndStatus(String slug, PostStatus status);

  @EntityGraph(attributePaths = {"category", "tags"})
  @Query("select p from Post p order by p.createdAt desc")
  List<Post> findAllForAdmin();
}
```

- [ ] **Step 2: Add search DTOs**

In `backend/src/main/java/com/example/blog/post/PostDtos.java`, add these imports:

```java
import org.springframework.data.domain.Page;

import java.util.function.Function;
```

Then add these records after `ArchiveMonth`:

```java
  public record PageResponse<T>(
      List<T> content,
      int number,
      int size,
      long totalElements,
      int totalPages) {
    public static <S, T> PageResponse<T> from(Page<S> page, Function<S, T> mapper) {
      return new PageResponse<>(
          page.getContent().stream().map(mapper).toList(),
          page.getNumber(),
          page.getSize(),
          page.getTotalElements(),
          page.getTotalPages());
    }
  }

  public record PostSearchRequest(
      Optional<String> keyword,
      Optional<Integer> year,
      Optional<String> category,
      Optional<String> tag,
      Optional<Integer> page,
      Optional<Integer> size,
      Optional<String> sort) {
  }
```

- [ ] **Step 3: Add service imports for search**

In `backend/src/main/java/com/example/blog/post/PostService.java`, add imports:

```java
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
```

Keep the existing `org.springframework.data.domain.Sort` import.

- [ ] **Step 4: Add public search method**

Add this method after `publicList` in `PostService`:

```java
  @Transactional(readOnly = true)
  public PageResponse<PostResponse> search(PostSearchRequest request) {
    Pageable pageable = PageRequest.of(
        normalizedPage(request.page()),
        normalizedSize(request.size()),
        publicSort(request.sort()));

    Specification<Post> spec = Specification.where(publishedPosts())
        .and(keywordMatches(request.keyword()))
        .and(publishedInYear(request.year()))
        .and(categorySlugMatches(request.category()))
        .and(tagSlugMatches(request.tag()));

    return PageResponse.from(posts.findAll(spec, pageable), this::response);
  }
```

- [ ] **Step 5: Add search helper methods**

Add these private methods in `PostService` before `apply`:

```java
  private int normalizedPage(Optional<Integer> page) {
    return Math.max(0, page.orElse(0));
  }

  private int normalizedSize(Optional<Integer> size) {
    int requested = size.orElse(10);
    if (requested < 1) {
      return 10;
    }
    return Math.min(requested, 50);
  }

  private Sort publicSort(Optional<String> requestedSort) {
    return switch (requestedSort.map(String::trim).orElse("publishedAt,desc")) {
      case "publishedAt,asc" -> Sort.by(Sort.Direction.ASC, "publishedAt");
      case "title,asc" -> Sort.by(Sort.Direction.ASC, "title");
      case "title,desc" -> Sort.by(Sort.Direction.DESC, "title");
      default -> Sort.by(Sort.Direction.DESC, "publishedAt");
    };
  }

  private Optional<String> normalizedText(Optional<String> value) {
    return value.map(String::trim).filter(text -> !text.isBlank());
  }

  private Specification<Post> publishedPosts() {
    return (root, query, criteria) -> criteria.equal(root.get("status"), PostStatus.PUBLISHED);
  }

  private Specification<Post> keywordMatches(Optional<String> keyword) {
    Optional<String> normalized = normalizedText(keyword).map(text -> "%" + text.toLowerCase(Locale.ROOT) + "%");
    return normalized
        .<Specification<Post>>map(pattern -> (root, query, criteria) -> criteria.or(
            criteria.like(criteria.lower(root.get("title")), pattern),
            criteria.like(criteria.lower(root.get("summary")), pattern),
            criteria.like(criteria.lower(root.get("contentHtml")), pattern)))
        .orElse(null);
  }

  private Specification<Post> publishedInYear(Optional<Integer> year) {
    return year
        .filter(value -> value > 0)
        .<Specification<Post>>map(value -> {
          Instant start = LocalDate.of(value, 1, 1).atStartOfDay(ZoneOffset.UTC).toInstant();
          Instant end = LocalDate.of(value + 1, 1, 1).atStartOfDay(ZoneOffset.UTC).toInstant();
          return (root, query, criteria) -> criteria.and(
              criteria.greaterThanOrEqualTo(root.get("publishedAt"), start),
              criteria.lessThan(root.get("publishedAt"), end));
        })
        .orElse(null);
  }

  private Specification<Post> categorySlugMatches(Optional<String> categorySlug) {
    return normalizedText(categorySlug)
        .<Specification<Post>>map(slug -> (root, query, criteria) ->
            criteria.equal(root.join("category", JoinType.INNER).get("slug"), slug))
        .orElse(null);
  }

  private Specification<Post> tagSlugMatches(Optional<String> tagSlug) {
    return normalizedText(tagSlug)
        .<Specification<Post>>map(slug -> (root, query, criteria) -> {
          query.distinct(true);
          return criteria.equal(root.join("tags", JoinType.INNER).get("slug"), slug);
        })
        .orElse(null);
  }
```

- [ ] **Step 6: Add controller endpoint**

In `backend/src/main/java/com/example/blog/post/PostController.java`, add this method after `publicList`:

```java
  @GetMapping("/api/v1/posts/search")
  public PageResponse<PostResponse> publicSearch(
      @RequestParam Optional<String> keyword,
      @RequestParam Optional<Integer> year,
      @RequestParam Optional<String> category,
      @RequestParam Optional<String> tag,
      @RequestParam Optional<Integer> page,
      @RequestParam Optional<Integer> size,
      @RequestParam Optional<String> sort) {
    return postService.search(new PostSearchRequest(keyword, year, category, tag, page, size, sort));
  }
```

The existing `import static com.example.blog.post.PostDtos.*;` already exposes the nested records.

- [ ] **Step 7: Run backend search tests and verify they pass**

Run:

```powershell
cd backend
.\mvnw.cmd test -Dtest=PostSearchControllerTest
```

Expected result: PASS for `PostSearchControllerTest`.

- [ ] **Step 8: Commit backend search implementation**

Run:

```powershell
git add backend/src/main/java/com/example/blog/post/PostRepository.java backend/src/main/java/com/example/blog/post/PostDtos.java backend/src/main/java/com/example/blog/post/PostService.java backend/src/main/java/com/example/blog/post/PostController.java
git commit -m "Add public post search endpoint"
```

---

### Task 3: Add Frontend Search API

**Files:**
- Create: `frontend/apps/web/src/lib/api.test.ts`
- Modify: `frontend/apps/web/src/lib/api.ts`

- [ ] **Step 1: Write failing frontend API tests**

Create `frontend/apps/web/src/lib/api.test.ts` with:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";

describe("publicApi.searchPosts", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("builds search query params while preserving page zero", async () => {
    const fetchMock = vi.fn(async () => new Response(
      JSON.stringify({ content: [], number: 0, size: 10, totalElements: 0, totalPages: 0 }),
      { headers: { "Content-Type": "application/json" } }
    ));
    vi.stubGlobal("fetch", fetchMock);
    const { publicApi } = await import("./api");

    await publicApi.searchPosts({
      keyword: " vue ",
      year: 2026,
      category: "frontend",
      tag: "notes",
      page: 0,
      size: 10,
      sort: "publishedAt,desc"
    });

    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/v1/posts/search?keyword=+vue+&year=2026&category=frontend&tag=notes&page=0&size=10&sort=publishedAt%2Cdesc"
    );
  });

  it("omits empty search params", async () => {
    const fetchMock = vi.fn(async () => new Response(
      JSON.stringify({ content: [], number: 0, size: 10, totalElements: 0, totalPages: 0 }),
      { headers: { "Content-Type": "application/json" } }
    ));
    vi.stubGlobal("fetch", fetchMock);
    const { publicApi } = await import("./api");

    await publicApi.searchPosts({
      keyword: "",
      year: "",
      category: undefined,
      tag: "   ",
      page: undefined,
      size: 10,
      sort: ""
    });

    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/posts/search?size=10");
  });
});
```

- [ ] **Step 2: Run frontend API tests and verify they fail**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web test -- src/lib/api.test.ts
```

Expected result: FAIL because `publicApi.searchPosts` does not exist.

- [ ] **Step 3: Implement searchPosts**

Modify `frontend/apps/web/src/lib/api.ts` to import `PageResponse`:

```ts
import { ApiClient, type ArchiveMonth, type Category, type PageResponse, type Post, type SitePage, type Tag } from "@blog/shared";
```

Add this interface after the `api` const:

```ts
export interface PostSearchParams {
  keyword?: string | null;
  year?: string | number | null;
  category?: string | null;
  tag?: string | null;
  page?: number | null;
  size?: number | null;
  sort?: string | null;
}
```

Add this helper before `export const publicApi`:

```ts
export function cleanPostSearchParams(params: PostSearchParams = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    if (typeof value === "string" && value.trim() === "") {
      return;
    }
    query.set(key, String(value));
  });
  return query;
}
```

Add this method inside `publicApi` before `post(slug: string)`:

```ts
  searchPosts(params: PostSearchParams = {}) {
    const query = cleanPostSearchParams(params);
    return api.get<PageResponse<Post>>(`/v1/posts/search${query.size ? `?${query}` : ""}`);
  },
```

- [ ] **Step 4: Run frontend API tests and verify they pass**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web test -- src/lib/api.test.ts
```

Expected result: PASS for `api.test.ts`.

- [ ] **Step 5: Commit frontend API search**

Run:

```powershell
git add frontend/apps/web/src/lib/api.ts frontend/apps/web/src/lib/api.test.ts
git commit -m "Add public archive search API client"
```

---

### Task 4: Add Archive UI Components

**Files:**
- Create: `frontend/apps/web/src/components/ArchiveFilters.test.ts`
- Create: `frontend/apps/web/src/components/ArchiveFilters.vue`
- Create: `frontend/apps/web/src/components/ArchivePostList.test.ts`
- Create: `frontend/apps/web/src/components/ArchivePostList.vue`
- Create: `frontend/apps/web/src/components/PaginationControls.test.ts`
- Create: `frontend/apps/web/src/components/PaginationControls.vue`

- [ ] **Step 1: Write failing ArchiveFilters tests**

Create `frontend/apps/web/src/components/ArchiveFilters.test.ts` with:

```ts
import { mount } from "@vue/test-utils";
import type { Category, Tag } from "@blog/shared";
import { describe, expect, it } from "vitest";
import ArchiveFilters from "./ArchiveFilters.vue";

const categories: Category[] = [{ id: 1, name: "Engineering", slug: "engineering", sortOrder: 0 }];
const tags: Tag[] = [{ id: 2, name: "Vue", slug: "vue" }];

function mountFilters() {
  return mount(ArchiveFilters, {
    props: {
      filters: {
        keyword: "vue",
        year: "2026",
        category: "engineering",
        tag: "vue",
        sort: "publishedAt,desc"
      },
      years: ["2026", "2025"],
      categories,
      tags,
      taxonomyAvailable: true
    }
  });
}

describe("ArchiveFilters", () => {
  it("renders filter controls and emits search with edited values", async () => {
    const wrapper = mountFilters();

    expect(wrapper.get("label[for='archive-keyword']").text()).toContain("Keyword");
    await wrapper.get("#archive-keyword").setValue("spring");
    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("search")?.[0]?.[0]).toMatchObject({ keyword: "spring", year: "2026" });
  });

  it("emits reset from the reset button", async () => {
    const wrapper = mountFilters();

    await wrapper.get('[data-test="archive-reset"]').trigger("click");

    expect(wrapper.emitted("reset")).toHaveLength(1);
  });

  it("hides taxonomy selects when taxonomy options are unavailable", () => {
    const wrapper = mount(ArchiveFilters, {
      props: {
        filters: { keyword: "", year: "", category: "", tag: "", sort: "publishedAt,desc" },
        years: [],
        categories: [],
        tags: [],
        taxonomyAvailable: false
      }
    });

    expect(wrapper.find("#archive-category").exists()).toBe(false);
    expect(wrapper.find("#archive-tag").exists()).toBe(false);
  });
});
```

- [ ] **Step 2: Implement ArchiveFilters**

Create `frontend/apps/web/src/components/ArchiveFilters.vue` with:

```vue
<template>
  <form class="archive-filters" @submit.prevent="submitSearch">
    <label for="archive-keyword">
      <span>Keyword</span>
      <input id="archive-keyword" v-model="draft.keyword" type="search" aria-label="Search title, summary, content" />
    </label>

    <label for="archive-year">
      <span>Year</span>
      <select id="archive-year" v-model="draft.year">
        <option value="">All years</option>
        <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
      </select>
    </label>

    <label v-if="taxonomyAvailable" for="archive-category">
      <span>Category</span>
      <select id="archive-category" v-model="draft.category">
        <option value="">All categories</option>
        <option v-for="category in categories" :key="category.id" :value="category.slug">{{ category.name }}</option>
      </select>
    </label>

    <label v-if="taxonomyAvailable" for="archive-tag">
      <span>Tag</span>
      <select id="archive-tag" v-model="draft.tag">
        <option value="">All tags</option>
        <option v-for="tag in tags" :key="tag.id" :value="tag.slug">#{{ tag.name }}</option>
      </select>
    </label>

    <label for="archive-sort">
      <span>Sort</span>
      <select id="archive-sort" v-model="draft.sort">
        <option value="publishedAt,desc">Newest</option>
        <option value="publishedAt,asc">Oldest</option>
        <option value="title,asc">Title A-Z</option>
        <option value="title,desc">Title Z-A</option>
      </select>
    </label>

    <div class="archive-filter-actions">
      <button type="submit">Search</button>
      <button data-test="archive-reset" type="button" @click="$emit('reset')">Reset</button>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { Category, Tag } from "@blog/shared";
import { reactive, watch } from "vue";
import type { PostSearchParams } from "../lib/api";

const props = defineProps<{
  filters: Required<Pick<PostSearchParams, "keyword" | "year" | "category" | "tag" | "sort">>;
  years: string[];
  categories: Category[];
  tags: Tag[];
  taxonomyAvailable: boolean;
}>();

const emit = defineEmits<{
  search: [filters: Required<Pick<PostSearchParams, "keyword" | "year" | "category" | "tag" | "sort">>];
  reset: [];
}>();

const draft = reactive({ ...props.filters });

watch(
  () => props.filters,
  (nextFilters) => {
    Object.assign(draft, nextFilters);
  },
  { deep: true }
);

function submitSearch() {
  emit("search", { ...draft });
}
</script>
```

- [ ] **Step 3: Write failing ArchivePostList tests**

Create `frontend/apps/web/src/components/ArchivePostList.test.ts` with:

```ts
import { mount } from "@vue/test-utils";
import type { Post } from "@blog/shared";
import { describe, expect, it } from "vitest";
import ArchivePostList from "./ArchivePostList.vue";

const posts: Post[] = [
  {
    id: 1,
    title: "Reader Upgrade",
    slug: "reader-upgrade",
    summary: "Better archive discovery.",
    coverMediaUrl: "/uploads/cover.png",
    status: "PUBLISHED",
    publishedAt: "2026-05-20T00:00:00Z",
    category: { id: 1, name: "Engineering", slug: "engineering" },
    tags: [{ id: 2, name: "Vue", slug: "vue" }]
  }
];

describe("ArchivePostList", () => {
  it("renders dense article list entries", () => {
    const wrapper = mount(ArchivePostList, {
      props: { posts },
      global: {
        stubs: {
          RouterLink: { props: ["to"], template: "<a :href='to'><slot /></a>" }
        }
      }
    });

    expect(wrapper.get(".archive-discovery-title").text()).toBe("Reader Upgrade");
    expect(wrapper.get("img").attributes("src")).toBe("/uploads/cover.png");
    expect(wrapper.get("a[href='/posts/reader-upgrade']").exists()).toBe(true);
    expect(wrapper.text()).toContain("Better archive discovery.");
    expect(wrapper.text()).toContain("Engineering");
    expect(wrapper.text()).toContain("#Vue");
  });

  it("renders reset action for empty results", async () => {
    const wrapper = mount(ArchivePostList, { props: { posts: [] } });

    await wrapper.get('[data-test="empty-reset"]').trigger("click");

    expect(wrapper.text()).toContain("No matching articles");
    expect(wrapper.emitted("reset")).toHaveLength(1);
  });
});
```

- [ ] **Step 4: Implement ArchivePostList**

Create `frontend/apps/web/src/components/ArchivePostList.vue` with:

```vue
<template>
  <div v-if="posts.length" class="archive-discovery-list">
    <article v-for="post in posts" :key="post.id" class="archive-discovery-item">
      <RouterLink class="archive-discovery-cover-link" :to="`/posts/${post.slug}`">
        <img v-if="post.coverMediaUrl" class="archive-discovery-cover" :src="post.coverMediaUrl" :alt="post.title" loading="lazy" />
        <span v-else class="archive-discovery-cover archive-discovery-cover--empty" aria-hidden="true" />
      </RouterLink>
      <div class="archive-discovery-copy">
        <span class="date">{{ formatDate(post.publishedAt) }}</span>
        <RouterLink class="archive-discovery-title" :to="`/posts/${post.slug}`">{{ post.title }}</RouterLink>
        <p v-if="post.summary">{{ post.summary }}</p>
        <div class="archive-post-meta">
          <RouterLink v-if="post.category" :to="`/categories/${post.category.slug}`">{{ post.category.name }}</RouterLink>
          <span v-else>Uncategorized</span>
          <template v-if="post.tags?.length">
            <RouterLink v-for="tag in post.tags" :key="tag.id" :to="`/tags/${tag.slug}`">#{{ tag.name }}</RouterLink>
          </template>
          <span v-else>No tags</span>
        </div>
      </div>
    </article>
  </div>
  <section v-else class="empty-state archive-empty">
    <p>No matching articles</p>
    <button data-test="empty-reset" type="button" @click="$emit('reset')">Reset filters</button>
  </section>
</template>

<script setup lang="ts">
import { formatDate, type Post } from "@blog/shared";

defineProps<{ posts: Post[] }>();
defineEmits<{ reset: [] }>();
</script>
```

- [ ] **Step 5: Write failing PaginationControls tests**

Create `frontend/apps/web/src/components/PaginationControls.test.ts` with:

```ts
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import PaginationControls from "./PaginationControls.vue";

describe("PaginationControls", () => {
  it("renders current page and emits previous and next pages", async () => {
    const wrapper = mount(PaginationControls, {
      props: { page: 1, totalPages: 3 }
    });

    expect(wrapper.text()).toContain("Page 2 of 3");

    await wrapper.get('[data-test="previous-page"]').trigger("click");
    await wrapper.get('[data-test="next-page"]').trigger("click");

    expect(wrapper.emitted("change")).toEqual([[0], [2]]);
  });

  it("disables unavailable navigation", () => {
    const wrapper = mount(PaginationControls, {
      props: { page: 0, totalPages: 1 }
    });

    expect(wrapper.get('[data-test="previous-page"]').attributes("disabled")).toBeDefined();
    expect(wrapper.get('[data-test="next-page"]').attributes("disabled")).toBeDefined();
  });
});
```

- [ ] **Step 6: Implement PaginationControls**

Create `frontend/apps/web/src/components/PaginationControls.vue` with:

```vue
<template>
  <nav class="pagination-controls" aria-label="Article pagination">
    <button data-test="previous-page" type="button" :disabled="page <= 0" @click="$emit('change', page - 1)">Previous</button>
    <span>Page {{ displayPage }} of {{ displayTotal }}</span>
    <button data-test="next-page" type="button" :disabled="page >= totalPages - 1 || totalPages <= 1" @click="$emit('change', page + 1)">Next</button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  page: number;
  totalPages: number;
}>();

defineEmits<{
  change: [page: number];
}>();

const displayPage = computed(() => Math.min(props.page + 1, Math.max(props.totalPages, 1)));
const displayTotal = computed(() => Math.max(props.totalPages, 1));
</script>
```

- [ ] **Step 7: Run component tests and verify they pass**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web test -- src/components/ArchiveFilters.test.ts src/components/ArchivePostList.test.ts src/components/PaginationControls.test.ts
```

Expected result: PASS for the three new component test files.

- [ ] **Step 8: Commit archive components**

Run:

```powershell
git add frontend/apps/web/src/components/ArchiveFilters.vue frontend/apps/web/src/components/ArchiveFilters.test.ts frontend/apps/web/src/components/ArchivePostList.vue frontend/apps/web/src/components/ArchivePostList.test.ts frontend/apps/web/src/components/PaginationControls.vue frontend/apps/web/src/components/PaginationControls.test.ts
git commit -m "Add archive discovery components"
```

---

### Task 5: Wire ArchiveView To Search API And URL State

**Files:**
- Modify: `frontend/apps/web/src/views/ArchiveView.test.ts`
- Modify: `frontend/apps/web/src/views/ArchiveView.vue`

- [ ] **Step 1: Replace ArchiveView tests with discovery behavior tests**

Replace `frontend/apps/web/src/views/ArchiveView.test.ts` with:

```ts
import { flushPromises, mount } from "@vue/test-utils";
import type { Category, PageResponse, Post, Tag } from "@blog/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ArchiveView from "./ArchiveView.vue";

const routeMock = vi.hoisted(() => ({ query: {} as Record<string, string> }));
const replaceMock = vi.hoisted(() => vi.fn());
const searchPostsMock = vi.hoisted(() => vi.fn());
const categoriesMock = vi.hoisted(() => vi.fn());
const tagsMock = vi.hoisted(() => vi.fn());

vi.mock("vue-router", async () => {
  const actual = await vi.importActual<typeof import("vue-router")>("vue-router");
  return {
    ...actual,
    useRoute: () => routeMock,
    useRouter: () => ({ replace: replaceMock })
  };
});

vi.mock("../lib/api", () => ({
  publicApi: {
    searchPosts: searchPostsMock,
    categories: categoriesMock,
    tags: tagsMock
  }
}));

const posts: Post[] = [
  {
    id: 1,
    title: "Reader Upgrade",
    slug: "reader-upgrade",
    summary: "Better discovery.",
    status: "PUBLISHED",
    publishedAt: "2026-05-20T00:00:00Z",
    category: { id: 1, name: "Engineering", slug: "engineering" },
    tags: [{ id: 2, name: "Vue", slug: "vue" }]
  }
];

const page: PageResponse<Post> = {
  content: posts,
  number: 0,
  size: 10,
  totalElements: 1,
  totalPages: 1
};

const categories: Category[] = [{ id: 1, name: "Engineering", slug: "engineering", sortOrder: 0 }];
const tags: Tag[] = [{ id: 2, name: "Vue", slug: "vue" }];

function mountArchive() {
  return mount(ArchiveView, {
    global: {
      stubs: {
        RouterLink: { props: ["to"], template: "<a :href='to'><slot /></a>" }
      }
    }
  });
}

describe("ArchiveView", () => {
  beforeEach(() => {
    routeMock.query = {};
    replaceMock.mockReset();
    searchPostsMock.mockReset();
    categoriesMock.mockReset();
    tagsMock.mockReset();
    searchPostsMock.mockResolvedValue(page);
    categoriesMock.mockResolvedValue(categories);
    tagsMock.mockResolvedValue(tags);
  });

  it("loads default search results and taxonomy options", async () => {
    const wrapper = mountArchive();
    await flushPromises();

    expect(searchPostsMock).toHaveBeenCalledWith({ page: 0, size: 10, sort: "publishedAt,desc" });
    expect(categoriesMock).toHaveBeenCalled();
    expect(tagsMock).toHaveBeenCalled();
    expect(wrapper.text()).toContain("All Articles");
    expect(wrapper.text()).toContain("1 result");
    expect(wrapper.text()).toContain("Reader Upgrade");
  });

  it("restores filters from URL query", async () => {
    routeMock.query = {
      keyword: "vue",
      year: "2026",
      category: "engineering",
      tag: "vue",
      sort: "title,asc",
      page: "2"
    };

    mountArchive();
    await flushPromises();

    expect(searchPostsMock).toHaveBeenCalledWith({
      keyword: "vue",
      year: "2026",
      category: "engineering",
      tag: "vue",
      page: 2,
      size: 10,
      sort: "title,asc"
    });
  });

  it("updates the URL query when searching and resets page to zero", async () => {
    const wrapper = mountArchive();
    await flushPromises();

    await wrapper.get("#archive-keyword").setValue("spring");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(replaceMock).toHaveBeenCalledWith({
      query: { keyword: "spring", page: "0", size: "10", sort: "publishedAt,desc" }
    });
    expect(searchPostsMock).toHaveBeenLastCalledWith({
      keyword: "spring",
      page: 0,
      size: 10,
      sort: "publishedAt,desc"
    });
  });

  it("clears filters when reset is clicked", async () => {
    routeMock.query = { keyword: "vue", page: "1" };
    const wrapper = mountArchive();
    await flushPromises();

    await wrapper.get('[data-test="archive-reset"]').trigger("click");
    await flushPromises();

    expect(replaceMock).toHaveBeenCalledWith({ query: {} });
    expect(searchPostsMock).toHaveBeenLastCalledWith({ page: 0, size: 10, sort: "publishedAt,desc" });
  });

  it("keeps article search usable when taxonomy loading fails", async () => {
    categoriesMock.mockRejectedValue(new Error("categories failed"));
    tagsMock.mockRejectedValue(new Error("tags failed"));

    const wrapper = mountArchive();
    await flushPromises();

    expect(wrapper.text()).toContain("Reader Upgrade");
    expect(wrapper.find("#archive-category").exists()).toBe(false);
    expect(wrapper.find("#archive-tag").exists()).toBe(false);
  });
});
```

- [ ] **Step 2: Run ArchiveView tests and verify they fail**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web test -- src/views/ArchiveView.test.ts
```

Expected result: FAIL because `ArchiveView.vue` still calls `archive()` and does not render the discovery UI.

- [ ] **Step 3: Replace ArchiveView implementation**

Replace `frontend/apps/web/src/views/ArchiveView.vue` with:

```vue
<template>
  <main class="content-band archive-discovery">
    <div class="section-head archive-discovery-head">
      <div>
        <h1>All Articles</h1>
        <p>Browse posts by time, topic, and keyword.</p>
      </div>
      <strong>{{ resultLabel }}</strong>
    </div>

    <ArchiveFilters
      :filters="filterState"
      :years="years"
      :categories="categories"
      :tags="tags"
      :taxonomy-available="taxonomyAvailable"
      @search="searchFromFilters"
      @reset="resetFilters"
    />

    <p v-if="loadError" class="archive-error">{{ loadError }}</p>

    <ArchivePostList :posts="pageData.content" @reset="resetFilters" />

    <PaginationControls
      :page="pageData.number"
      :total-pages="pageData.totalPages"
      @change="changePage"
    />
  </main>
</template>

<script setup lang="ts">
import type { Category, PageResponse, Post, Tag } from "@blog/shared";
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import ArchiveFilters from "../components/ArchiveFilters.vue";
import ArchivePostList from "../components/ArchivePostList.vue";
import PaginationControls from "../components/PaginationControls.vue";
import { publicApi, type PostSearchParams } from "../lib/api";

const DEFAULT_SORT = "publishedAt,desc";
const PAGE_SIZE = 10;

type ArchiveFilterState = Required<Pick<PostSearchParams, "keyword" | "year" | "category" | "tag" | "sort">>;

const route = useRoute();
const router = useRouter();
const categories = ref<Category[]>([]);
const tags = ref<Tag[]>([]);
const taxonomyAvailable = ref(true);
const loadError = ref("");
const pageData = ref<PageResponse<Post>>({
  content: [],
  number: 0,
  size: PAGE_SIZE,
  totalElements: 0,
  totalPages: 0
});

const filterState = reactive<ArchiveFilterState>({
  keyword: queryString(route.query.keyword),
  year: queryString(route.query.year),
  category: queryString(route.query.category),
  tag: queryString(route.query.tag),
  sort: queryString(route.query.sort) || DEFAULT_SORT
});

const years = computed(() => {
  const fromResults = pageData.value.content
    .map((post) => post.publishedAt?.slice(0, 4))
    .filter((year): year is string => Boolean(year));
  return Array.from(new Set([...fromResults, filterState.year].filter(Boolean))).sort((left, right) => right.localeCompare(left));
});

const resultLabel = computed(() => {
  const total = pageData.value.totalElements;
  return `${total} ${total === 1 ? "result" : "results"}`;
});

function queryString(value: unknown) {
  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
}

function queryPage(value: unknown) {
  const parsed = Number(queryString(value));
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

function activeParams(page = queryPage(route.query.page)): PostSearchParams {
  return {
    keyword: filterState.keyword,
    year: filterState.year,
    category: filterState.category,
    tag: filterState.tag,
    page,
    size: PAGE_SIZE,
    sort: filterState.sort || DEFAULT_SORT
  };
}

function cleanQuery(params: PostSearchParams) {
  const query: Record<string, string> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    if (typeof value === "string" && value.trim() === "") {
      return;
    }
    query[key] = String(value);
  });
  return query;
}

async function loadPosts(params: PostSearchParams) {
  loadError.value = "";
  try {
    pageData.value = await publicApi.searchPosts(params);
  } catch {
    loadError.value = "Articles could not be loaded. Try again later.";
    pageData.value = { content: [], number: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 0 };
  }
}

async function loadTaxonomy() {
  try {
    const [loadedCategories, loadedTags] = await Promise.all([publicApi.categories(), publicApi.tags()]);
    categories.value = loadedCategories;
    tags.value = loadedTags;
    taxonomyAvailable.value = true;
  } catch {
    categories.value = [];
    tags.value = [];
    taxonomyAvailable.value = false;
  }
}

async function searchFromFilters(nextFilters: ArchiveFilterState) {
  Object.assign(filterState, nextFilters);
  const params = activeParams(0);
  await router.replace({ query: cleanQuery(params) });
  await loadPosts(params);
}

async function resetFilters() {
  Object.assign(filterState, { keyword: "", year: "", category: "", tag: "", sort: DEFAULT_SORT });
  await router.replace({ query: {} });
  await loadPosts({ page: 0, size: PAGE_SIZE, sort: DEFAULT_SORT });
}

async function changePage(page: number) {
  const params = activeParams(page);
  await router.replace({ query: cleanQuery(params) });
  await loadPosts(params);
}

onMounted(async () => {
  await Promise.all([
    loadTaxonomy(),
    loadPosts(activeParams())
  ]);
});
</script>
```

- [ ] **Step 4: Run ArchiveView tests and verify they pass**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web test -- src/views/ArchiveView.test.ts
```

Expected result: PASS for `ArchiveView.test.ts`.

- [ ] **Step 5: Commit ArchiveView wiring**

Run:

```powershell
git add frontend/apps/web/src/views/ArchiveView.vue frontend/apps/web/src/views/ArchiveView.test.ts
git commit -m "Wire archive discovery page"
```

---

### Task 6: Style Archive Discovery

**Files:**
- Modify: `frontend/apps/web/src/styles.css`

- [ ] **Step 1: Add archive discovery CSS**

Add this block before the existing `.archive-month` rules in `frontend/apps/web/src/styles.css`:

```css
.archive-discovery {
  display: grid;
  gap: 22px;
}

.archive-discovery-head p {
  font-size: 20px;
  font-weight: 800;
  margin: 12px 0 0;
}

.archive-discovery-head strong {
  border: 2px solid var(--ink);
  background: var(--yellow);
  color: #11100d;
  font-family: "IBM Plex Mono", monospace;
  padding: 8px 10px;
}

.archive-filters {
  border: var(--line);
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(220px, 2fr) repeat(4, minmax(140px, 1fr)) auto;
  padding: 14px;
}

.archive-filters label {
  display: grid;
  gap: 6px;
  font-weight: 900;
}

.archive-filters span {
  font-family: "IBM Plex Mono", monospace;
  font-size: 12px;
  text-transform: uppercase;
}

.archive-filters input,
.archive-filters select {
  background: var(--paper);
  border: 2px solid var(--ink);
  color: var(--ink);
  font: inherit;
  min-height: 42px;
  min-width: 0;
  padding: 8px;
  width: 100%;
}

.archive-filter-actions {
  align-self: end;
  display: flex;
  gap: 8px;
}

.archive-filter-actions button,
.pagination-controls button,
.archive-empty button {
  background: var(--red);
  border: 2px solid var(--ink);
  color: var(--paper);
  cursor: pointer;
  font: inherit;
  font-weight: 900;
  min-height: 42px;
  padding: 8px 12px;
}

.archive-filter-actions button[type="button"],
.pagination-controls button:disabled,
.archive-empty button {
  background: var(--paper);
  color: var(--ink);
}

.pagination-controls button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.archive-error {
  border: 2px solid var(--red);
  color: var(--red);
  font-weight: 900;
  margin: 0;
  padding: 10px 12px;
}

.archive-discovery-list {
  border-top: var(--line);
  display: grid;
}

.archive-discovery-item {
  border-bottom: var(--line);
  display: grid;
  gap: 14px;
  grid-template-columns: 160px minmax(0, 1fr);
  padding: 18px 0;
}

.archive-discovery-cover-link {
  aspect-ratio: 4 / 3;
  background: var(--yellow);
  border: 2px solid var(--ink);
  display: block;
  overflow: hidden;
}

.archive-discovery-cover {
  display: block;
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.archive-discovery-cover--empty {
  background:
    linear-gradient(135deg, transparent 0 46%, var(--ink) 47% 53%, transparent 54%),
    var(--paper);
}

.archive-discovery-copy {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.archive-discovery-title {
  font-family: "Archivo Black", "Arial Black", sans-serif;
  font-size: clamp(28px, 5vw, 48px);
  line-height: 0.95;
  overflow-wrap: anywhere;
}

.archive-discovery-copy p {
  font-size: 18px;
  line-height: 1.5;
  margin: 0;
}

.archive-empty {
  display: grid;
  gap: 12px;
}

.archive-empty p {
  margin: 0;
}

.pagination-controls {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.pagination-controls span {
  font-family: "IBM Plex Mono", monospace;
  font-weight: 900;
}
```

- [ ] **Step 2: Add mobile archive discovery CSS**

Inside the existing `@media (max-width: 760px)` block, add:

```css
  .archive-filters {
    grid-template-columns: 1fr;
  }

  .archive-filter-actions,
  .pagination-controls {
    align-items: stretch;
    flex-direction: column;
  }

  .archive-discovery-item {
    grid-template-columns: 72px minmax(0, 1fr);
  }

  .archive-discovery-title {
    font-size: 26px;
  }
```

- [ ] **Step 3: Run web tests and build**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web test
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web build
```

Expected result: PASS for all web tests and web build.

- [ ] **Step 4: Commit archive discovery styles**

Run:

```powershell
git add frontend/apps/web/src/styles.css
git commit -m "Style archive discovery page"
```

---

### Task 7: Full Verification And Browser Check

**Files:**
- Modify only files already touched if verification exposes defects.

- [ ] **Step 1: Run backend tests**

Run:

```powershell
cd backend
.\mvnw.cmd test
```

Expected result: PASS for the backend test suite.

- [ ] **Step 2: Run public web tests**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web test
```

Expected result: PASS for all `@blog/web` tests.

- [ ] **Step 3: Run public web build**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web build
```

Expected result: PASS for `vue-tsc --noEmit` and Vite build.

- [ ] **Step 4: Browser-check archive discovery desktop layout**

Start the app stack using the existing project startup path or run the backend and public web app separately. Open:

```text
http://127.0.0.1:5174/archive
```

Verify:

- The page title, description, and result count are visible.
- Keyword, year, category, tag, sort, search, and reset controls fit without overlap.
- Default list loads from `/api/v1/posts/search`.
- Search updates the URL query and list.
- Reset clears filters and URL query.
- Pagination controls are visible and disabled/enabled correctly.
- Dense list entries show title, summary, date, category, tags, and thumbnail.

- [ ] **Step 5: Browser-check mobile layout**

At a narrow width around `390px`, verify:

- Filter controls stack vertically.
- Buttons fit inside the viewport.
- Long titles and tags wrap.
- List items do not create horizontal scrolling.
- Pagination controls stack cleanly.

- [ ] **Step 6: Fix verification defects with focused changes**

If backend behavior fails, add or adjust the failing MockMvc test before changing backend code. If frontend behavior fails, add or adjust the relevant Vitest test before changing Vue code. For pure CSS overlap, change only `frontend/apps/web/src/styles.css`.

Acceptable focused CSS fixes include:

```css
.archive-filters {
  min-width: 0;
}

.archive-filter-actions button {
  max-width: 100%;
}

.archive-discovery-copy {
  overflow-wrap: anywhere;
}
```

- [ ] **Step 7: Re-run final verification after any fix**

Run:

```powershell
cd backend
.\mvnw.cmd test
cd ..
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web test
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web build
```

Expected result: all three commands pass.

- [ ] **Step 8: Commit final verification fixes**

If Step 6 changed files, run:

```powershell
git add backend/src frontend/apps/web/src
git commit -m "Polish archive discovery verification"
```

If Step 6 did not change files, skip this commit.

---

## Plan Self-Review

- Spec coverage: backend search API, keyword/year/category/tag filters, pagination, sort fallback, URL state, dense list, reset, empty state, taxonomy failure tolerance, accessibility, mobile layout, and verification are covered by Tasks 1-7.
- Scope check: no new `/posts` page, no search engine, no admin editor work, no RSS/SEO work, and no removal of the existing archive endpoint.
- Missing-detail scan: each task includes exact paths, concrete test code, implementation snippets, commands, and expected results.
- Type consistency: `PostSearchRequest`, `PageResponse<T>`, `PostSearchParams`, `ArchiveFilterState`, `ArchiveFilters`, `ArchivePostList`, and `PaginationControls` are introduced before use and reused consistently.
