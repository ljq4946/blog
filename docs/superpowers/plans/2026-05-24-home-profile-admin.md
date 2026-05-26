# Home Profile Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a persisted, admin-editable homepage music and personal introduction profile with real audio URL support.

**Architecture:** Add a small `HomeProfile` backend resource with public read and admin upsert endpoints. Extend shared types and public/admin API clients, then bind the public homepage interlude and a new admin editor view to that resource.

**Tech Stack:** Spring Boot, JPA, Flyway, MockMvc, Vue 3, Element Plus, Vitest, TypeScript.

---

## File Structure

- Create `backend/src/main/java/com/example/blog/homeprofile/HomeProfile.java`: JPA entity for the single homepage profile row.
- Create `backend/src/main/java/com/example/blog/homeprofile/HomeProfileRepository.java`: repository keyed by `profile_key`.
- Create `backend/src/main/java/com/example/blog/homeprofile/HomeProfileController.java`: public/admin endpoints and default profile response.
- Create `backend/src/main/resources/db/migration/V3__add_home_profile.sql`: table for persisted profile data.
- Create `backend/src/test/java/com/example/blog/homeprofile/HomeProfileControllerTest.java`: MockMvc tests for defaults and admin updates.
- Modify `backend/src/main/java/com/example/blog/config/SecurityConfig.java`: permit public profile GET.
- Modify `frontend/packages/shared/src/types.ts`: add `HomeProfile` and `HomeProfileInput`.
- Modify `frontend/apps/web/src/lib/api.ts`: add `publicApi.homeProfile()`.
- Modify `frontend/apps/web/src/views/HomeView.vue`: load profile data, render configured text, and attach `<audio>`.
- Modify `frontend/apps/web/src/views/HomeView.test.ts`: cover configured profile values and audio URL.
- Modify `frontend/apps/admin/src/lib/api.ts`: add `adminApi.homeProfile()` and `adminApi.saveHomeProfile()`.
- Modify `frontend/apps/admin/src/lib/api.test.ts`: cover endpoint paths.
- Create `frontend/apps/admin/src/views/HomeProfileView.vue`: admin editor form.
- Create `frontend/apps/admin/src/views/HomeProfileView.test.ts`: load/save behavior.
- Modify `frontend/apps/admin/src/router/index.ts`: add `/home-profile` route.
- Modify `frontend/apps/admin/src/App.vue`: add homepage navigation link.

## Task 1: Backend Profile Resource

- [ ] Write failing backend test in `backend/src/test/java/com/example/blog/homeprofile/HomeProfileControllerTest.java` proving public defaults, admin update, and public readback.
- [ ] Run `.\mvnw -Dtest=HomeProfileControllerTest test` from `backend`; expect compilation or 404 failures because the resource does not exist.
- [ ] Add `HomeProfile`, repository, controller, migration, and public security matcher.
- [ ] Run `.\mvnw -Dtest=HomeProfileControllerTest test`; expect pass.

## Task 2: Shared Types And API Clients

- [ ] Add failing API client expectations in `frontend/apps/admin/src/lib/api.test.ts` for `GET /v1/admin/home-profile` and `PUT /v1/admin/home-profile`.
- [ ] Run `corepack pnpm --filter @blog/admin test -- api.test.ts` from `frontend`; expect missing-method failures.
- [ ] Add `HomeProfile` / `HomeProfileInput` types and public/admin API methods.
- [ ] Run `corepack pnpm --filter @blog/admin test -- api.test.ts`; expect pass.

## Task 3: Public Homepage Binding

- [ ] Update `frontend/apps/web/src/views/HomeView.test.ts` so `publicApi.homeProfile()` replaces default music/about copy and sets an audio source.
- [ ] Run `corepack pnpm --filter @blog/web test -- HomeView.test.ts`; expect missing API/mock or missing rendered configured data failures.
- [ ] Update `HomeView.vue` to load profile, render configured values, include `<audio :src="profile.musicAudioUrl">`, and keep defaults on failure.
- [ ] Run `corepack pnpm --filter @blog/web test -- HomeView.test.ts`; expect pass.

## Task 4: Admin Editor View

- [ ] Add `HomeProfileView.test.ts` proving the view loads profile data, edits music and intro fields, and saves the payload.
- [ ] Run `corepack pnpm --filter @blog/admin test -- HomeProfileView.test.ts`; expect missing component or route-level dependency failures.
- [ ] Add `HomeProfileView.vue`, route entry, and sidebar link.
- [ ] Run `corepack pnpm --filter @blog/admin test -- HomeProfileView.test.ts`; expect pass.

## Task 5: Verification

- [ ] Run backend focused tests: `.\mvnw -Dtest=HomeProfileControllerTest test`.
- [ ] Run frontend focused tests: `corepack pnpm --filter @blog/web test -- HomeView.test.ts` and `corepack pnpm --filter @blog/admin test -- api.test.ts HomeProfileView.test.ts`.
- [ ] Run web/admin builds: `corepack pnpm --filter @blog/web build` and `corepack pnpm --filter @blog/admin build`.
- [ ] Use the in-app browser or available local server to inspect the homepage interlude and admin editor layout.
