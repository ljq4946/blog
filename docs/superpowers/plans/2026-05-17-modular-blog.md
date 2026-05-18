# Modular Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready modular blog system with a Java backend, separate Vue admin and public frontend apps, MySQL persistence, media management, and a minimalist constructivist visual direction.

**Architecture:** Use a single repository with independent `backend`, `frontend/apps/admin`, and `frontend/apps/web` applications, plus shared frontend packages. The backend exposes versioned REST APIs for authentication, content management, media, and public reading, while Nginx routes public pages, admin pages, and API traffic in production.

**Tech Stack:** Java 21, Spring Boot 3.x, Maven, Spring Data JPA, Flyway, Spring Security, JWT, MySQL, Vue 3, Vite, TypeScript, pnpm workspace, Element Plus, TipTap, Vitest, Playwright, Docker Compose, Nginx.

---

## Summary

Build a modular blog project from an almost empty workspace. The system has two separate frontend apps:

- `admin`: a Vue 3 management UI for login, posts, categories, tags, media, and the about page.
- `web`: a Vue 3 public reading site with homepage, post list, post detail, category pages, tag pages, about page, and archive page.

The backend is a Spring Boot REST service backed by MySQL. Content is stored in the database. Uploaded media files are stored on local persistent disk, with metadata stored in MySQL.

The visual direction is balanced minimalist constructivism: the public site uses strong grid composition, bold lines, paper/black/red/blue/yellow accents, and asymmetric layout; the admin app remains efficient and tool-like, using Element Plus with custom theme variables.

## Repository Structure

Create this high-level structure:

```text
backend/
frontend/
  apps/
    admin/
    web/
  packages/
    shared/
deploy/
docs/
  superpowers/
    plans/
```

Responsibilities:

- `backend`: Spring Boot API, domain modules, database migrations, security, upload handling.
- `frontend/apps/admin`: admin routes, management screens, TipTap editor, Element Plus theme.
- `frontend/apps/web`: public reading routes and custom constructivist UI.
- `frontend/packages/shared`: typed API client, DTO types, date helpers, slug helpers, shared design tokens.
- `deploy`: Docker Compose, Nginx config, environment examples, production persistence notes.

## Backend Plan

### Task 1: Bootstrap Spring Boot Backend

**Files:**

- Create: `backend/pom.xml`
- Create: `backend/src/main/java/com/example/blog/BlogApplication.java`
- Create: `backend/src/main/resources/application.yml`
- Create: `backend/src/test/java/com/example/blog/BlogApplicationTests.java`

- [ ] Create a Spring Boot 3.x Maven project using Java 21.
- [ ] Add dependencies for Web, Validation, Spring Data JPA, MySQL driver, Flyway, Spring Security, JWT support, Lombok if desired, and test dependencies.
- [ ] Configure `application.yml` to read database, JWT, admin bootstrap, and upload settings from environment variables.
- [ ] Add a smoke test that loads the Spring context.
- [ ] Run `mvn test` from `backend`.

### Task 2: Add Database Migrations

**Files:**

- Create: `backend/src/main/resources/db/migration/V1__init_schema.sql`

- [ ] Create tables for `users`, `posts`, `categories`, `tags`, `post_tags`, `media_assets`, and `site_pages`.
- [ ] Use `DRAFT` and `PUBLISHED` as the only v1 post statuses.
- [ ] Add unique constraints for slugs, usernames, tag names, category names, media stored names, and site page keys.
- [ ] Add indexes for published posts, category lookup, tag lookup, and archive queries by `published_at`.
- [ ] Run migration through a Spring Boot integration test using Testcontainers MySQL.

### Task 3: Implement Auth Module

**Files:**

- Create package: `backend/src/main/java/com/example/blog/auth`
- Create tests under: `backend/src/test/java/com/example/blog/auth`

- [ ] Add `User` entity with `username`, `passwordHash`, `role`, and timestamps.
- [ ] Add startup bootstrap that creates the first admin from `ADMIN_USERNAME` and `ADMIN_PASSWORD` when no admin exists.
- [ ] Add BCrypt password hashing.
- [ ] Add `POST /api/v1/auth/login` returning a JWT.
- [ ] Add `GET /api/v1/auth/me` returning the current admin profile.
- [ ] Secure all `/api/v1/admin/**` routes with JWT.
- [ ] Test successful login, failed login, unauthorized admin access, and valid token access with JUnit 5 and MockMvc.

### Task 4: Implement Content Modules

**Files:**

- Create packages: `backend/src/main/java/com/example/blog/post`, `category`, `tag`, `sitepage`
- Create tests under matching `backend/src/test/java/com/example/blog/*`

- [ ] Implement `Post`, `Category`, `Tag`, and `SitePage` entities and repositories.
- [ ] Implement admin CRUD endpoints:
  - `GET /api/v1/admin/posts`
  - `POST /api/v1/admin/posts`
  - `PUT /api/v1/admin/posts/{id}`
  - `DELETE /api/v1/admin/posts/{id}`
  - `GET /api/v1/admin/categories`
  - `POST /api/v1/admin/categories`
  - `PUT /api/v1/admin/categories/{id}`
  - `DELETE /api/v1/admin/categories/{id}`
  - `GET /api/v1/admin/tags`
  - `POST /api/v1/admin/tags`
  - `PUT /api/v1/admin/tags/{id}`
  - `DELETE /api/v1/admin/tags/{id}`
  - `GET /api/v1/admin/site-pages/about`
  - `PUT /api/v1/admin/site-pages/about`
- [ ] Implement public endpoints:
  - `GET /api/v1/posts`
  - `GET /api/v1/posts/{slug}`
  - `GET /api/v1/categories`
  - `GET /api/v1/tags`
  - `GET /api/v1/archive`
  - `GET /api/v1/site-pages/about`
- [ ] Ensure public APIs return only published posts.
- [ ] Test draft posts are hidden from public endpoints and visible to admin endpoints.

### Task 5: Implement Media Module

**Files:**

- Create package: `backend/src/main/java/com/example/blog/media`
- Create tests under: `backend/src/test/java/com/example/blog/media`

- [ ] Implement `MediaAsset` entity and repository.
- [ ] Configure an upload root from `UPLOAD_DIR`.
- [ ] Add `POST /api/v1/admin/media` for authenticated file upload.
- [ ] Add `GET /api/v1/admin/media` for paginated media listing.
- [ ] Add `DELETE /api/v1/admin/media/{id}` for metadata and file deletion.
- [ ] Serve uploaded files from a stable public URL prefix such as `/uploads/**`.
- [ ] Validate allowed MIME types for images and common attachments.
- [ ] Test successful upload, invalid MIME rejection, media listing, and delete behavior.

### Task 6: Add HTML Safety

**Files:**

- Create package: `backend/src/main/java/com/example/blog/security/html`
- Add tests under: `backend/src/test/java/com/example/blog/security/html`

- [ ] Sanitize rich text HTML before saving or before rendering from public APIs.
- [ ] Allow common blog markup such as headings, paragraphs, lists, blockquotes, links, images, and code blocks.
- [ ] Strip scripts, event handlers, unsafe URLs, and unsafe inline attributes.
- [ ] Test script removal, link handling, image handling, and normal TipTap HTML preservation.

## Frontend Plan

### Task 7: Bootstrap pnpm Workspace

**Files:**

- Create: `frontend/package.json`
- Create: `frontend/pnpm-workspace.yaml`
- Create: `frontend/tsconfig.base.json`
- Create: `frontend/packages/shared/package.json`

- [ ] Configure pnpm workspace for `apps/*` and `packages/*`.
- [ ] Add shared TypeScript settings.
- [ ] Add scripts for `dev:admin`, `dev:web`, `build`, `test`, and `lint`.

### Task 8: Build Shared Frontend Package

**Files:**

- Create files under: `frontend/packages/shared/src`

- [ ] Define DTO types matching backend responses for auth, posts, categories, tags, media, and site pages.
- [ ] Implement a typed API client with base URL configuration.
- [ ] Implement token storage helpers for the admin app.
- [ ] Add date formatting and slug helper utilities.
- [ ] Add design token exports for paper, black, red, blue, yellow, border, spacing, and typography values.
- [ ] Add Vitest coverage for API URL building, token helpers, and utility functions.

### Task 9: Build Admin App

**Files:**

- Create app under: `frontend/apps/admin`

- [ ] Create Vue 3 + Vite + TypeScript app.
- [ ] Add Vue Router, Pinia, Element Plus, TipTap, and shared package dependency.
- [ ] Implement login page and authenticated app shell.
- [ ] Add routes for posts, post editor, categories, tags, media, and about page.
- [ ] Use Element Plus tables, forms, dialogs, pagination, and upload controls.
- [ ] Customize Element Plus theme toward minimalist constructivism: paper background, black borders, restrained red accent, square geometry, compact spacing.
- [ ] Implement TipTap editor with title, bold, italic, link, quote, lists, image insert, and preview-friendly HTML output.
- [ ] Test route guards, login flow state, post form validation, and API client integration boundaries.

### Task 10: Build Public Web App

**Files:**

- Create app under: `frontend/apps/web`

- [ ] Create Vue 3 + Vite + TypeScript app.
- [ ] Add Vue Router and shared package dependency.
- [ ] Implement homepage with featured/latest posts.
- [ ] Implement post list, post detail, category page, tag page, about page, and archive page.
- [ ] Render sanitized HTML from the API.
- [ ] Implement custom constructivist visual system with strong grids, bold borders, paper-like background, black typography, and controlled red/blue/yellow accents.
- [ ] Keep layout responsive for mobile, tablet, and desktop.
- [ ] Test public route rendering, archive grouping, category/tag filtering, and empty states.

## Deployment Plan

### Task 11: Add Docker Compose Production Setup

**Files:**

- Create: `deploy/docker-compose.yml`
- Create: `deploy/nginx.conf`
- Create: `deploy/.env.example`
- Create: `backend/Dockerfile`
- Create: `frontend/apps/admin/Dockerfile`
- Create: `frontend/apps/web/Dockerfile`

- [ ] Build backend as a Spring Boot container.
- [ ] Build admin and web as static frontend assets.
- [ ] Serve both frontends through Nginx.
- [ ] Route `/` to the public web app.
- [ ] Route `/admin` to the admin app.
- [ ] Route `/api` and `/uploads` to the backend.
- [ ] Persist MySQL data and uploaded files with Docker volumes.
- [ ] Document required environment variables for MySQL, JWT, admin bootstrap, upload path, and app origins.

### Task 12: Add End-to-End Verification

**Files:**

- Create: `frontend/e2e`
- Create: `docs/superpowers/plans/2026-05-17-modular-blog.md` updates only when the plan changes.

- [ ] Add Playwright tests for production-like local flow.
- [ ] Cover admin login.
- [ ] Cover media upload.
- [ ] Cover category and tag creation.
- [ ] Cover rich text post creation and publishing.
- [ ] Cover public post detail and archive visibility.
- [ ] Add a final verification command list to project documentation.

## Public Interfaces

REST APIs use `/api/v1`.

Auth:

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

Admin:

- `GET/POST/PUT/DELETE /api/v1/admin/posts`
- `GET/POST/PUT/DELETE /api/v1/admin/categories`
- `GET/POST/PUT/DELETE /api/v1/admin/tags`
- `GET/POST/DELETE /api/v1/admin/media`
- `GET/PUT /api/v1/admin/site-pages/about`

Public:

- `GET /api/v1/posts`
- `GET /api/v1/posts/{slug}`
- `GET /api/v1/categories`
- `GET /api/v1/tags`
- `GET /api/v1/archive`
- `GET /api/v1/site-pages/about`

Core DTOs:

- `Post`: `id`, `title`, `slug`, `summary`, `contentHtml`, `coverMediaId`, `status`, `categoryId`, `tagIds`, `createdAt`, `updatedAt`, `publishedAt`
- `Category`: `id`, `name`, `slug`, `description`, `sortOrder`
- `Tag`: `id`, `name`, `slug`
- `Media`: `id`, `originalName`, `storedName`, `url`, `mimeType`, `size`, `width`, `height`, `createdAt`
- `SitePage`: `key`, `title`, `contentHtml`, `updatedAt`

## Test Plan

- Backend unit tests: JUnit 5, AssertJ, Mockito.
- Backend API tests: MockMvc for authentication, admin protection, CRUD behavior, public visibility.
- Backend integration tests: Testcontainers MySQL for Flyway migrations and repository behavior.
- Frontend unit tests: Vitest + Vue Test Utils for shared utilities, route guards, forms, and rendering.
- E2E tests: Playwright for login, media upload, content publishing, and public reading.
- Deployment smoke test: `docker compose up -d`, then verify `/`, `/admin`, `/api/v1/posts`, and uploaded media URLs.

## Explicit Assumptions

- Use Maven for the Spring Boot backend.
- Use pnpm workspace for the frontend monorepo.
- Use Flyway for schema migrations.
- Use MySQL as the production database.
- Use local disk storage for uploaded files, with MySQL metadata.
- Use TipTap for rich text editing.
- Use Element Plus only in the admin app.
- Do not implement comments, public search, multiple authors, or role-based permissions in v1.
- Keep admin authentication to a single `ADMIN` role with JWT.
- Use Docker Compose and Nginx for single-server production deployment.

