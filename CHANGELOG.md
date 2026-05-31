# Changelog

## Unreleased

- No unreleased changes.

## 2.0.0 - 2026-05-31

- Upgrade the blog into a private knowledge system with `PUBLIC`/`PRIVATE` visibility and `ARTICLE`/`NOTE` content types.
- Add authenticated knowledge search, manual knowledge relations, private note to public article draft conversion, and JSON backup export.
- Keep public APIs, RSS, Sitemap, archive, comments, likes, topic pages, and series pages limited to public published articles.
- Add an admin knowledge base workspace for quick private note capture and conversion into publishable drafts.
- Raise backend, admin, web, and shared package versions to `2.0.0`.

## 1.6.0 - 2026-05-30

- Add a public homepage portfolio path that reuses the latest article, first topic, first series, and archive entry.
- Keep project showcase scope inside the existing article/topic/series model instead of adding a separate project module.
- Raise backend, admin, web, and shared package versions to `1.6.0`.

## 1.5.0 - 2026-05-30

- Add admin writing templates for project cases, technical notes, and release reviews.
- Add an admin statistics snapshot for views, likes, comment status counts, and popular posts.
- Surface lightweight feedback metrics on the admin dashboard.

## 1.4.0 - 2026-05-30

- Start the 1.4 content governance track with an admin governance snapshot API for post gaps, topic coverage, and series maintenance signals.
- Surface content governance metrics on the admin dashboard, topic management page, and series management page.
- Add an admin content map page that turns governance signals into topic, series, and article maintenance actions.
- Refresh the public homepage discovery area with latest posts, featured topics, ongoing series, and an archive entry.

## 1.3.0 - 2026-05-30

- Add scheduled publishing with `SCHEDULED` posts hidden from public surfaces until `publishedAt`.
- Add post SEO title and description fields, server-side post revisions, related posts, and lightweight view counts.
- Upgrade the admin author workflow with article filtering, SEO/canonical publishing controls, revision restore, quick taxonomy creation, media previews, media reference checks, and comment approval states.
- Extend health checks with database/upload status and add operation logs for key authoring actions.
- Raise backend, admin, web, and shared package versions to `1.3.0`.

## 1.2.0 - 2026-05-30

- Add flat topics for durable technical knowledge maps.
- Add ordered series for sequential article reading paths.
- Extend article editing, public archive filtering, and article detail pages with topic and series metadata.
- Improve technical SEO with topic/series sitemap URLs, richer page metadata, Twitter cards, and JSON-LD structured data.
- Raise backend, admin, web, and shared package versions to `1.2.0`.

## 1.1.0 - 2026-05-26

- 新增首页资料管理，支持音乐播放区块和个人介绍区块在管理端维护。
- 新增文章归档发现页与公开搜索接口。
- 增强文章阅读体验，补充目录、阅读进度、代码块交互和回到顶部能力。
- 增强管理端文章编辑器，补充媒体引用、封面预览和草稿恢复。
- 调整首页海报区与内容布局，统一前台视觉表现。
- 将后端、管理端、前台和共享包版本统一提升到 `1.1.0`。
