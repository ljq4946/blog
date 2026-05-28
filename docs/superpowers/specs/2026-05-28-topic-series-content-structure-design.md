# 1.2 Topic And Series Content Structure Design

## Goal

Turn the public technical blog from a chronological article list into a long-lived knowledge structure. Version 1.2 adds flat topics and ordered series while keeping the existing category and tag model.

The target audience is readers who use the site as a technical knowledge base, search result, and portfolio signal. The design should make related articles easier to discover, give sequential articles a clear reading path, and avoid turning the project into a generic CMS.

## Concepts

### Category

Categories are the site's broad sections. They answer: "Which main area does this article belong to?"

- Examples: backend, frontend, database, engineering practice.
- A post has zero or one category.
- Categories remain suitable for top-level navigation and broad filtering.
- The existing category model stays in place.

### Topic

Topics are flat knowledge themes. They answer: "Which durable knowledge maps should this article appear in?"

- Examples: Spring Boot, Vue 3, authentication and security, deployment and operations.
- A post can belong to many topics.
- Topics are not hierarchical in 1.2.
- Topics are stronger than tags: they have descriptions, ordering, and public landing pages.

### Series

Series are ordered reading paths. They answer: "Which posts should be read together, and in what order?"

- Examples: building a personal blog from scratch, Spring Security practice.
- A post can belong to zero or one series.
- A post in a series has a numeric `seriesOrder`.
- A series can optionally link to one primary topic.
- Series membership does not replace post topics; posts in a series can still belong to multiple topics.

### Tag

Tags are lightweight keywords. They answer: "Which fine-grained terms help search and association?"

- Examples: JWT, Flyway, TipTap, Nginx, SEO.
- A post can belong to many tags.
- Tags remain lightweight and do not get descriptions or hierarchy in 1.2.
- The existing tag model stays in place.

## Relationship Model

```text
Post
  category_id -> Category, optional, many posts to one category
  topics -> Topic[], many-to-many
  series_id -> Series, optional, many posts to one series
  series_order -> number, required only when series_id is set
  tags -> Tag[], many-to-many

Series
  primary_topic_id -> Topic, optional
```

Rules:

- Category is the broad public section.
- Topic is the durable knowledge map.
- Series is the ordered reading path.
- Tag is the small keyword index.
- Topics stay flat to avoid overlap with categories.
- Series can point to a primary topic but are allowed to be cross-topic.

Example post:

```text
Title: Spring Boot JWT 登录实现
Category: 后端
Topics: Spring Boot, 认证与安全
Series: 从零构建个人博客系统
Series order: 04
Tags: JWT, Spring Security, REST API
```

## Backend Design

Add a `topic` package and a `series` package following the current category/tag/post style.

### Topic Data

`topics` table:

- `id`
- `name`
- `slug`
- `description`
- `sort_order`
- `created_at`
- `updated_at`

`post_topics` table:

- `post_id`
- `topic_id`

Topic constraints:

- `name` is required and unique.
- `slug` is required and unique.
- `sort_order` defaults to `0`.
- Deleting a topic removes `post_topics` rows but does not delete posts.

### Series Data

`series` table:

- `id`
- `name`
- `slug`
- `description`
- `primary_topic_id`
- `sort_order`
- `created_at`
- `updated_at`

Post additions:

- `series_id`
- `series_order`

Series constraints:

- `name` is required and unique.
- `slug` is required and unique.
- `primary_topic_id` is optional.
- If `series_id` is set on a post, `series_order` must be set to a positive number.
- If `series_id` is not set, `series_order` must be null.
- `series_order` must be unique within one series.
- A series can be deleted only after posts are detached or reassigned.

## API Design

Public endpoints:

- `GET /api/v1/topics`
- `GET /api/v1/topics/{slug}`
- `GET /api/v1/series`
- `GET /api/v1/series/{slug}`

Admin endpoints:

- `GET /api/v1/admin/topics`
- `POST /api/v1/admin/topics`
- `PUT /api/v1/admin/topics/{id}`
- `DELETE /api/v1/admin/topics/{id}`
- `GET /api/v1/admin/series`
- `POST /api/v1/admin/series`
- `PUT /api/v1/admin/series/{id}`
- `DELETE /api/v1/admin/series/{id}`

Post DTO changes:

- Add `topics` to post responses.
- Add `topicIds`, `seriesId`, and `seriesOrder` to admin post input.
- Add `series` summary to post responses when present.
- Public post detail responses include previous and next post summaries when the post belongs to a series.
- Public list/search responses include only the compact `series` summary, not previous/next navigation.
- Keep existing `category` and `tags` fields unchanged.

Public topic detail responses return the topic, related series whose `primaryTopic` matches the topic, and published posts attached to the topic.

Public series detail responses return the series and its published posts ordered by `seriesOrder`.

Search and listing:

- Extend public post search to accept `topic` and `series` slug filters.
- Keep `category` and `tag` filters compatible with current URLs.
- Avoid introducing nested topic paths.

## Public Frontend

Add these routes:

- `/topics`
- `/topics/:slug`
- `/series`
- `/series/:slug`

Topic index:

- Shows flat topics ordered by `sortOrder`, then name.
- Each topic card shows name, description, and article count.

Topic detail:

- Shows topic name and description.
- Shows related series whose `primaryTopic` matches the topic.
- Shows published posts attached to the topic.

Series index:

- Shows all series ordered by `sortOrder`, then name.
- Each series card shows name, description, primary topic when present, and article count.

Series detail:

- Shows series name, description, and primary topic when present.
- Shows posts ordered by `seriesOrder`.
- Each article entry shows its order, title, summary, date, category, topics, and tags.

Article detail:

- Shows linked topics near category and tags.
- If the post belongs to a series, shows a compact series block with:
  - series name
  - current order
  - previous post
  - next post
  - link to full series page

## Admin Frontend

Keep existing category and tag management.

Add topic management:

- List topics.
- Create/edit topic name, slug, description, and sort order.
- Delete unused topics.

Add series management:

- List series.
- Create/edit series name, slug, description, optional primary topic, and sort order.
- Delete series only when no posts are attached, or show a clear backend validation error.

Update post editor publish panel:

- Add topic multi-select.
- Add series select.
- Add series order numeric input that appears only when a series is selected.
- Preserve existing category select and tag multi-select.

The large `PostEditorView.vue` should not be broadly refactored as part of this feature. Only extract small helpers/components if the series/topic fields make the publish panel too crowded.

## Error Handling And Validation

Backend:

- Return `400` for missing topic/series names, slugs, invalid series order, or unknown topic/series ids.
- Return `404` for unknown public topic or series slugs.
- Return `409` for deleting a series that still has attached posts, if the project adds conflict handling; otherwise use the existing bad request pattern.

Frontend:

- Topic and series public pages show the existing empty/error state style when loading fails.
- Post editor blocks save when a series is selected without a valid positive order.
- Public article pages remain usable if series navigation fails to load.

## Migration And Compatibility

- Existing posts keep their current category and tags.
- New topic and series fields are optional, so old posts remain valid.
- Existing public routes continue to work.
- Existing admin category/tag flows remain unchanged.
- Existing archive search keeps working and gains optional topic/series filters later in the implementation.

## Testing

Backend tests:

- Topic CRUD and public list/detail.
- Series CRUD and public list/detail.
- Post create/update with topics and optional series.
- Validation for invalid series order.
- Public search filtering by topic and series.

Frontend tests:

- Shared DTO/API method path coverage.
- Admin topic and series management screens.
- Post editor topic/series field behavior.
- Public topic index/detail.
- Public series index/detail.
- Article detail series navigation block.

Regression tests:

- Existing category and tag pages still render.
- Existing archive filters still work without topic/series params.
- Existing post creation still works without topic or series.

## Out Of Scope For 1.2

- Hierarchical topics.
- Multiple series per post.
- Topic aliases or redirects.
- Automatic topic/tag suggestion.
- Full editor refactor.
- Role-based editorial workflows.
- Cross-post dependency graphs beyond previous/next in a series.
