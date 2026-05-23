# 1.0 Release Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare the Modular Blog repository for a production-style 1.0 deployment check.

**Architecture:** Keep the release work scoped to deployable metadata, Docker build reliability, documentation, and repository hygiene. Do not change application behavior except where release version metadata and deployment packaging require it.

**Tech Stack:** Java 21, Spring Boot 3, Maven, Vue 3, pnpm 11, Vite, Docker Compose, Nginx.

---

### Task 1: Repository And Docker Hygiene

**Files:**
- Modify: `.gitignore`
- Delete: `.claude/settings.local.json`
- Modify: `frontend/.dockerignore`

- [ ] **Step 1: Remove committed local tool state**

Delete `.claude/settings.local.json` because it is local agent permission state and contains command history that should not be part of a production release.

- [ ] **Step 2: Ignore local tool state going forward**

Add `.claude/` to `.gitignore` alongside `.superpowers/`.

- [ ] **Step 3: Reduce Docker build context**

Extend `frontend/.dockerignore` with generated caches, logs, coverage, and local env files so frontend images only receive source and lock files needed for builds.

### Task 2: 1.0 Version And Image Build

**Files:**
- Modify: `backend/pom.xml`
- Modify: `backend/Dockerfile`
- Modify: `frontend/apps/admin/package.json`
- Modify: `frontend/apps/web/package.json`
- Modify: `frontend/packages/shared/package.json`

- [ ] **Step 1: Set release versions**

Change backend and frontend package versions from `0.1.0` / `0.1.0-SNAPSHOT` to `1.0.0`.

- [ ] **Step 2: Remove hard-coded backend jar name**

Change the backend Dockerfile final-stage copy to use the packaged jar wildcard so future version updates do not break image builds.

### Task 3: Release Documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/PROJECT_STRUCTURE.md`
- Create: `docs/RELEASE_1_0_CHECKLIST.md`

- [ ] **Step 1: Update quick-start release notes**

Document the 1.0 release posture, verification commands, Docker config check, and production environment values.

- [ ] **Step 2: Add dedicated 1.0 checklist**

Create a checklist covering Git cleanliness, generated artifacts, environment variables, Docker Compose, database persistence, upload persistence, and post-deploy smoke tests.

- [ ] **Step 3: Keep structure docs current**

Mention the release checklist and ignored local tool/build artifacts in `docs/PROJECT_STRUCTURE.md`.

### Task 4: Verification And Commit

**Files:**
- Verify working tree changes across all modified files.

- [ ] **Step 1: Run backend tests**

Run: `.\mvnw.cmd test` from `backend/`.

- [ ] **Step 2: Run frontend tests**

Run: `corepack pnpm --dir frontend test`.

- [ ] **Step 3: Run frontend build**

Run: `corepack pnpm --dir frontend build`.

- [ ] **Step 4: Validate Docker Compose config**

Run: `docker compose -f deploy/docker-compose.yml --env-file deploy/.env.example config`.

- [ ] **Step 5: Commit verified release readiness changes**

Stage the verified release-readiness files and commit with message `chore: prepare 1.0 release deployment`.
