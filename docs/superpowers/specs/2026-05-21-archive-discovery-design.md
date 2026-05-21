# Archive Discovery Design

## Status

Approved direction: upgrade the existing `/archive` page into a comprehensive article discovery page.

This stage follows the reader-experience roadmap after the article reading page upgrade. The archive should remain time-aware, but it should become useful for finding articles by keyword, year, category, tag, pagination, and sorting.

## Goals

- Turn `/archive` into the primary public article list and content discovery page.
- Add a backend-backed public article query API for scalable filtering and pagination.
- Support keyword, year, category, tag, page, size, and sort query parameters.
- Keep the archive page shareable by syncing filter state to the URL query string.
- Preserve the existing `/api/v1/archive` endpoint for compatibility.
- Keep the first version simple enough to build and test without introducing a full search engine.

## Non-Goals

- No Elasticsearch, Meilisearch, Lucene, or external full-text search service.
- No advanced search syntax.
- No saved searches or subscriptions.
- No recommendation algorithm.
- No admin editor changes.
- No new `/posts` page in this stage.
- No removal of the existing archive endpoint.
- No SEO, RSS, sitemap, or Open Graph work in this stage.

## Current Context

The public web app currently has:

- `/` home page with a large hero and the latest three posts.
- `/archive` page using `publicApi.archive()` to render posts grouped by month.
- `/categories/:slug` and `/tags/:slug` pages using `publicApi.posts({ category/tag })`.
- `PostCard.vue` for card-style post display.
- `publicApi.posts()`, `publicApi.post()`, `publicApi.categories()`, `publicApi.tags()`, and `publicApi.archive()`.

The backend currently exposes:

- `GET /api/v1/posts` with optional `category` and `tag` filters.
- `GET /api/v1/posts/{slug}` for article detail.
- `GET /api/v1/archive` for month-grouped archive data.

The next step should add a unified article query API while keeping the existing routes and archive endpoint stable.

## API Design

Add a public endpoint:

```text
GET /api/v1/posts/search
```

Supported query parameters:

- `keyword`: optional text query.
- `year`: optional published year such as `2026`.
- `category`: optional category slug.
- `tag`: optional tag slug.
- `page`: optional zero-based page number, default `0`.
- `size`: optional page size, default `10`.
- `sort`: optional sort key, default `publishedAt,desc`.

Response shape:

```ts
PageResponse<Post>
```

Use the existing shared page response structure:

```ts
{
  content: Post[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
```

Query behavior:

- Only `PUBLISHED` posts are returned.
- `keyword` matches `title`, `summary`, and `contentHtml` using database `LIKE` in the first version.
- `year` filters `publishedAt` from January 1 inclusive to January 1 of the next year exclusive.
- `category` filters by category slug.
- `tag` filters by tag slug.
- Multiple filters combine with `AND`.
- Empty string parameters are ignored.

Sort behavior:

Only a small whitelist is accepted:

- `publishedAt,desc`
- `publishedAt,asc`
- `title,asc`
- `title,desc`

Invalid sort values fall back to `publishedAt,desc` or return a validation error. The implementation plan should pick one behavior and test it explicitly. The recommended behavior is fallback, because it is friendlier for public URLs.

## Backend Design

Keep this change inside the existing post module.

Responsibilities:

- `PostController`: expose `GET /api/v1/posts/search`.
- `PostService`: normalize query parameters, build paging and sorting, call repository query, map to `PostResponse`.
- `PostRepository`: add a query mechanism that supports optional filters.

Implementation options:

- Use a JPQL query with nullable filter parameters and a separate count query.
- Or use Spring Data JPA `Specification` if adding `JpaSpecificationExecutor` keeps the code cleaner.

Preferred approach:

- Use `Specification` if it stays local and readable.
- Avoid adding a broad query abstraction or search service for this first version.

Backend tests should cover:

- Default query returns only published posts.
- Draft posts never appear.
- Keyword matches title, summary, and content HTML.
- Year filters by `publishedAt`.
- Category slug filters results.
- Tag slug filters results.
- Multiple filters combine correctly.
- Pagination metadata is correct.
- Sort whitelist behavior is correct.

## Frontend API Design

Add `publicApi.searchPosts(params)` in:

```text
frontend/apps/web/src/lib/api.ts
```

Suggested TypeScript shape:

```ts
export interface PostSearchParams {
  keyword?: string;
  year?: string | number;
  category?: string;
  tag?: string;
  page?: number;
  size?: number;
  sort?: string;
}
```

Behavior:

- Skip empty strings, `null`, and `undefined` values when building query params.
- Keep `page=0` when explicitly set.
- Return `PageResponse<Post>`.

The archive page also uses:

- `publicApi.categories()` for category filter options.
- `publicApi.tags()` for tag filter options.

If categories or tags fail to load, the article list should still work.

## Page Experience

`/archive` becomes an article discovery page.

Top section:

- Page title: `全部文章`.
- Short description: “按时间、主题或关键词浏览文章”.
- Result count for the active filter set.

Filter section:

- Keyword input.
- Year selector.
- Category selector.
- Tag selector.
- Sort selector.
- Search button.
- Reset button.

Sort labels:

- `最新发布` -> `publishedAt,desc`
- `最早发布` -> `publishedAt,asc`
- `标题 A-Z` -> `title,asc`
- `标题 Z-A` -> `title,desc`

List section:

- Use a denser article list layout instead of large post cards.
- Each item shows title, summary, published date, category, tags, and optional cover thumbnail.
- Title and thumbnail link to the article detail page.
- Category and tags link to their taxonomy pages.
- Empty state says there are no matching articles and offers reset.

Pagination section:

- Previous page button.
- Next page button.
- Current page and total pages.
- First version uses fixed page size `10`.

Time awareness:

- Each article still shows published date.
- Year filter reinforces archive semantics.
- The older month-grouped `/api/v1/archive` endpoint remains available for a future “timeline mode”.

## URL State

Archive filters should sync to query string:

```text
/archive?keyword=vue&year=2026&category=frontend&tag=notes&sort=publishedAt,desc&page=0
```

Rules:

- On initial load, read filters from `route.query`.
- Search button writes query state and fetches results.
- Pagination changes update `page` and fetch results.
- Reset clears query state and reloads default results.
- Empty values should not remain in the URL.
- Search should reset `page` to `0`.

Do not fire a search on every keystroke. First version searches on button click or Enter.

## Components And Boundaries

Recommended frontend structure:

- `ArchiveView.vue`: route orchestrator, URL query sync, data loading, and high-level state.
- `ArchiveFilters.vue`: filter form and reset/search events.
- `ArchivePostList.vue`: dense article list rendering.
- `PaginationControls.vue`: small reusable previous/next pagination controls.

Keep component props explicit and avoid a global store.

The implementation plan may keep everything in `ArchiveView.vue` only if the final file remains easy to understand, but the preferred design is to split the filter/list/pagination responsibilities because this page will keep growing.

## Error Handling

- If article search fails, show a readable error and keep the current filter controls visible.
- If category or tag options fail, hide or disable only those filter controls and keep article search usable.
- If page query is invalid or negative, normalize to `0`.
- If size query is invalid, use `10`.
- If sort query is invalid, use the default sort.
- If requested page is beyond available results, show the empty state with a reset option rather than crashing.

## Accessibility And Responsiveness

- Filter controls need labels.
- Search and reset buttons must be keyboard reachable.
- Pagination buttons must expose disabled state.
- Result count should be visible text.
- On mobile, filters stack vertically.
- Article list items should not overflow horizontally.
- Long titles and tags should wrap cleanly.
- Buttons and select controls should fit at narrow widths.

## Testing

Backend tests:

- Search endpoint returns a paged response.
- Default search returns published posts only.
- Drafts are excluded.
- Keyword search matches title.
- Keyword search matches summary.
- Keyword search matches content HTML.
- Year filter works.
- Category slug filter works.
- Tag slug filter works.
- Combined filters work.
- Pagination returns expected `number`, `size`, `totalElements`, and `totalPages`.
- Sort whitelist fallback works.

Frontend API tests:

- `searchPosts` builds query params correctly.
- Empty values are omitted.
- `page=0` is preserved.
- Response type is `PageResponse<Post>`.

Frontend view/component tests:

- Archive page loads default results.
- Archive page reads initial filters from URL query.
- Search updates URL query and fetches results.
- Reset clears query and reloads default results.
- Empty results show an empty state.
- Pagination updates page and fetches results.
- Category/tag option loading failure does not block article search.
- Dense list renders title, summary, date, category, tags, and thumbnail.

Verification:

- Run backend tests.
- Run public web tests.
- Run public web build.
- Browser-check `/archive` at desktop and mobile widths.

## Implementation Order

1. Add backend tests for public post search.
2. Implement repository/service/controller query support.
3. Add shared/frontend API tests for `searchPosts`.
4. Implement `publicApi.searchPosts`.
5. Add archive page tests for default load and URL restoration.
6. Wire `/archive` to backend search results.
7. Add filter form behavior and URL query sync.
8. Add dense list and pagination components.
9. Add responsive styling and browser verification.

## Later Phases

After this stage:

- Add a homepage content discovery refresh that links into archive filters.
- Add timeline/list view switching if month grouping remains useful.
- Add related posts or next/previous links on article detail pages.
- Add RSS, sitemap, Open Graph, and structured data once content discovery is stable.
