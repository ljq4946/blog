# Article Reading Experience Design

## Status

Approved direction: reader experience growth, focused on the public article detail page.

This stage improves the reading experience for a mixed personal blog where technical articles are the primary content, while personal writing and portfolio-style posts should still feel natural.

## Goals

- Make individual article pages more comfortable to read.
- Improve technical content rendering for code, inline code, links, quotes, images, lists, and tables.
- Add long-form reading aids: table of contents, heading anchors, reading progress, and back-to-top.
- Add a simple dark mode for sustained reading.
- Keep the work scoped to the public web app and compatible with the existing TipTap HTML content.

## Non-Goals

- No comment system.
- No search feature.
- No RSS or subscription system.
- No related-post recommendation system.
- No SEO, sitemap, or Open Graph work in this stage.
- No admin editor changes.
- No backend schema changes or article content model rewrite.
- No full Markdown, MDX, or block-rendering pipeline.

## Current Context

The project already has:

- A Spring Boot backend with public post detail and list APIs.
- A Vue 3 public web app.
- A Vue 3 admin app for creating and editing posts.
- Existing routes for home, article detail, taxonomy pages, archive, and about.
- Existing article detail rendering in `frontend/apps/web/src/views/PostDetailView.vue`.
- Existing article body HTML rendered from `post.contentHtml`.

The current article detail page is intentionally simple: it shows publication date, title, summary, and rendered HTML. The next stage should build on that route instead of replacing the content pipeline.

## Page Experience

The article detail page becomes a focused reading surface.

Desktop layout:

- Article header with publication date, category, tags, title, summary, and cover image when available.
- Main reading column with a comfortable max width and complete prose styles.
- Right-side support column with an automatically generated table of contents and reading preference control.
- Top reading progress indicator.
- Back-to-top control for long pages.

Mobile layout:

- Article header appears first.
- Body remains single-column.
- Table of contents is collapsed into a button or compact panel.
- Reading progress remains visible.
- Back-to-top remains available.
- No fixed side column should squeeze the content.

## Components

Keep the public article route as the orchestrator and split focused behavior into small components:

- `PostDetailView.vue`: fetches the post, owns page layout, handles loading and error states, and passes article HTML into child components.
- `ArticleRenderer.vue`: renders trusted article HTML, generates heading anchors, extracts table-of-contents data, and enhances code blocks.
- `ArticleToc.vue`: renders `h2` and `h3` table-of-contents entries, supports anchor navigation, and highlights the current section.
- `ReadingProgress.vue`: shows top-page reading progress based on scroll position.
- `ReadingPreferences.vue`: owns first-version dark-mode toggle and persists the setting.

The existing `.prose` styling can be expanded into a proper article typography system instead of introducing a broad design framework.

## Prose Rendering

The prose system should cover:

- H1-H4 heading rhythm and anchors.
- Paragraph line height and vertical spacing.
- Strong, emphasis, links, and inline code.
- Ordered and unordered lists.
- Blockquotes.
- Tables with horizontal overflow on small screens.
- Images with max-width, caption-friendly spacing, and predictable border/radius behavior.
- Code blocks with syntax highlighting, horizontal scroll, copy button, and optional language label when detectable.

The page should preserve existing article HTML and avoid mutating saved content. Enhancements happen in the renderer after content is mounted.

## Data Flow

- `PostDetailView.vue` fetches the post with the existing `publicApi.post(slug)`.
- `ArticleRenderer.vue` receives `contentHtml`.
- `ArticleRenderer.vue` parses rendered headings on mount/update, generates stable slugs, applies `id` attributes, and emits table-of-contents items.
- `PostDetailView.vue` stores the emitted TOC data and passes it to `ArticleToc.vue`.
- `ArticleToc.vue` observes scroll position or receives active heading state from a composable.
- `ReadingProgress.vue` computes progress from document scroll position.
- `ReadingPreferences.vue` reads and writes dark mode to `localStorage`, then applies a class or data attribute to the public web root.

## Implementation Strategy

- Do not change database tables or backend APIs.
- Keep compatibility with current TipTap HTML.
- Generate heading anchors client-side from heading text, with deterministic suffixes for duplicate headings.
- Base the first table of contents on `h2` and `h3` only.
- Add code highlighting as a public-web dependency only if the current stack does not already include a suitable highlighter.
- Add copy-code buttons progressively after the article HTML renders.
- Keep dark mode simple: light/dark theme toggle only. Do not add font-size or font-family preferences in the first stage.
- Prefer small Vue components and pure helper functions where behavior is testable.

## Error Handling

- If article loading fails, show a readable empty/error state instead of a blank page.
- If content has no headings, hide the table of contents.
- If anchor generation encounters duplicate or empty headings, generate deterministic fallback IDs.
- If code highlighting fails for a block, keep the original code visible.
- If clipboard copy fails, keep the copy button usable and show a non-blocking failure state.
- If `localStorage` is unavailable, dark mode should still work for the current session.

## Accessibility And Responsiveness

- Reading progress should not be the only indicator of position; TOC active state should use visible text styling.
- TOC links should be keyboard reachable.
- Copy-code buttons should have accessible labels.
- Dark mode must preserve contrast for body text, code blocks, links, and borders.
- On mobile, no content or controls should overlap.
- Code blocks and tables should scroll horizontally without expanding the page width.
- Back-to-top should be reachable by keyboard and not cover important content.

## Testing

Use focused tests around behavior and rendering:

- `PostDetailView` renders title, summary, metadata, body, and cover image when available.
- `PostDetailView` shows a clear state when loading fails.
- `ArticleRenderer` extracts `h2` and `h3` headings into TOC data.
- `ArticleRenderer` generates stable IDs for duplicate headings.
- `ArticleRenderer` enhances code blocks with copy actions while preserving code text.
- `ArticleToc` renders entries and navigates to anchors.
- `ReadingProgress` updates progress from scroll position.
- `ReadingPreferences` reads/writes dark mode state in `localStorage`.

Verification:

- Run the public web unit tests.
- Run the public web build.
- Browser-check article detail at desktop and mobile widths.
- Confirm prose, code blocks, TOC, progress, back-to-top, and dark mode do not overlap or break layout.

## Later Phases

After this stage, reader-growth work can continue with:

- Search and content discovery.
- Related posts and next/previous article navigation.
- RSS and update subscription.
- SEO, sitemap, Open Graph, and structured data.
- Series pages for technical article collections.
