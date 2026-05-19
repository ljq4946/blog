# Focus Writing Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a focused article writing workbench with right-side publishing controls, in-page preview, autosave, local recovery, and publish checks.

**Architecture:** Keep the existing `PostEditorView.vue` as the page orchestrator. Add pure helper behavior in `features/posts/postForm.ts`, and split the right-side publishing panel into `PostPublishPanel.vue` only after helper tests are green. Autosave and recovery stay local to the admin editor and use existing `adminApi.createPost` / `adminApi.updatePost`.

**Tech Stack:** Vue 3, Vue Router, Element Plus, TipTap, Vitest, Vue Test Utils, pnpm via Corepack.

---

## File Structure

- Modify `frontend/apps/admin/src/features/posts/postForm.ts`: add publish checklist, autosave eligibility, and recovery helper functions while preserving existing validation and conversion behavior.
- Modify `frontend/apps/admin/src/features/posts/postForm.test.ts`: add test-first coverage for the helper functions.
- Create `frontend/apps/admin/src/views/PostPublishPanel.vue`: focused right-side panel for save status, publish checks, status, slug, summary, cover, category, and tags.
- Modify `frontend/apps/admin/src/views/PostEditorView.vue`: add two-column workbench layout, edit/preview switch, autosave, recovery prompt, and publish-blocking logic.
- Modify `frontend/apps/admin/src/views/PostEditorView.test.ts`: add view behavior tests for preview, publish checks, autosave, and recovery.
- Keep `frontend/apps/admin/src/styles.css` unchanged unless the final browser pass shows global editor styles are required.

## Commands

Use these commands from `D:\work\demo\blog`:

- Admin tests: `node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/admin test`
- Admin build: `node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/admin build`

---

### Task 1: Add Post Form Helper Tests

**Files:**
- Modify: `frontend/apps/admin/src/features/posts/postForm.test.ts`
- Modify in Step 3: `frontend/apps/admin/src/features/posts/postForm.ts`

- [ ] **Step 1: Write failing tests for publish checks, autosave, and recovery helpers**

Add these imports to `frontend/apps/admin/src/features/posts/postForm.test.ts`:

```ts
import {
  canAutosavePost,
  postFormSnapshot,
  postRecoveryKey,
  postRecoverySnapshot,
  publishChecklist,
  toPostInput,
  validatePostForm,
  wordCountFromHtml
} from "./postForm";
```

Replace the existing import from `./postForm` with the block above, preserving all existing tests.

Append these tests to the same file:

```ts
describe("publishChecklist", () => {
  it("marks required checks as blocking and recommended checks as warnings", () => {
    const checks = publishChecklist({
      title: "",
      slug: "",
      summary: "",
      contentHtml: "<p></p>",
      coverMediaId: null,
      status: "DRAFT",
      categoryId: null,
      tagIds: []
    });

    expect(checks.filter((check) => check.level === "required" && !check.passed).map((check) => check.key)).toEqual([
      "title",
      "slug",
      "content"
    ]);
    expect(checks.filter((check) => check.level === "recommended" && !check.passed).map((check) => check.key)).toEqual([
      "summary",
      "category",
      "tags",
      "cover"
    ]);
  });

  it("passes every check when the post is ready to publish", () => {
    const checks = publishChecklist({
      title: "Readable article",
      slug: "readable-article",
      summary: "A useful summary",
      contentHtml: "<p>正文内容</p>",
      coverMediaId: 7,
      status: "DRAFT",
      categoryId: 1,
      tagIds: [2]
    });

    expect(checks.every((check) => check.passed)).toBe(true);
  });
});

describe("canAutosavePost", () => {
  it("allows existing posts to autosave when required fields are valid", () => {
    expect(
      canAutosavePost(
        {
          title: "Existing",
          slug: "existing",
          contentHtml: "<p>content</p>",
          status: "PUBLISHED",
          tagIds: []
        },
        { isNew: false }
      )
    ).toBe(true);
  });

  it("blocks new post autosave until title and slug are valid", () => {
    expect(
      canAutosavePost(
        {
          title: "Draft",
          slug: "",
          contentHtml: "<p>content</p>",
          status: "DRAFT",
          tagIds: []
        },
        { isNew: true }
      )
    ).toBe(false);
  });
});

describe("post recovery helpers", () => {
  it("uses a stable key for new and existing posts", () => {
    expect(postRecoveryKey()).toBe("post-editor:new");
    expect(postRecoveryKey(12)).toBe("post-editor:12");
  });

  it("creates a serializable recovery snapshot with normalized form data", () => {
    const snapshot = postRecoverySnapshot(
      {
        title: "  Hello  ",
        slug: "hello",
        summary: "Summary",
        contentHtml: "<p>正文</p>",
        coverMediaId: null,
        status: "DRAFT",
        categoryId: null,
        tagIds: [3, 1],
        publishedAt: null
      },
      1779012492167
    );

    expect(snapshot.updatedAt).toBe(1779012492167);
    expect(snapshot.form.title).toBe("Hello");
    expect(snapshot.form.tagIds).toEqual([1, 3]);
  });
});
```

- [ ] **Step 2: Run the helper tests and verify they fail for missing exports**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/admin test -- src/features/posts/postForm.test.ts
```

Expected result: FAIL with TypeScript/runtime errors indicating `publishChecklist`, `canAutosavePost`, `postRecoveryKey`, or `postRecoverySnapshot` are not exported.

- [ ] **Step 3: Implement the helper types and functions**

Add these exports to `frontend/apps/admin/src/features/posts/postForm.ts` after the `PostForm` type:

```ts
export type PublishCheckLevel = "required" | "recommended";

export interface PublishCheck {
  key: "title" | "slug" | "content" | "summary" | "category" | "tags" | "cover";
  label: string;
  level: PublishCheckLevel;
  passed: boolean;
}

export interface AutosaveOptions {
  isNew: boolean;
}

export interface PostRecoverySnapshot {
  form: ReturnType<typeof toPostInput>;
  updatedAt: number;
}
```

Add these functions to the end of `frontend/apps/admin/src/features/posts/postForm.ts`:

```ts
export function publishChecklist(form: PostForm): PublishCheck[] {
  const contentWords = wordCountFromHtml(form.contentHtml);
  return [
    { key: "title", label: "标题", level: "required", passed: Boolean(form.title?.trim()) },
    { key: "slug", label: "URL 标识", level: "required", passed: Boolean(form.slug?.trim()) },
    { key: "content", label: "正文", level: "required", passed: contentWords > 0 },
    { key: "summary", label: "摘要", level: "recommended", passed: Boolean(form.summary?.trim()) },
    { key: "category", label: "分类", level: "recommended", passed: form.categoryId !== null && form.categoryId !== undefined },
    { key: "tags", label: "标签", level: "recommended", passed: (form.tagIds ?? []).length > 0 },
    { key: "cover", label: "封面", level: "recommended", passed: form.coverMediaId !== null && form.coverMediaId !== undefined }
  ];
}

export function canAutosavePost(form: PostForm, options: AutosaveOptions) {
  if (!form.title?.trim() || !form.slug?.trim()) {
    return false;
  }
  if (!form.status) {
    return false;
  }
  if (options.isNew && (!form.title.trim() || !form.slug.trim())) {
    return false;
  }
  return true;
}

export function postRecoveryKey(postId?: number | string | null) {
  return postId === undefined || postId === null ? "post-editor:new" : `post-editor:${postId}`;
}

export function postRecoverySnapshot(form: PostForm, updatedAt = Date.now()): PostRecoverySnapshot {
  return {
    form: toPostInput({
      ...form,
      tagIds: [...(form.tagIds ?? [])].sort((left, right) => left - right)
    }),
    updatedAt
  };
}
```

- [ ] **Step 4: Run the helper tests and verify they pass**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/admin test -- src/features/posts/postForm.test.ts
```

Expected result: PASS for `postForm.test.ts`.

- [ ] **Step 5: Commit helper tests and implementation**

Run:

```powershell
git add frontend/apps/admin/src/features/posts/postForm.ts frontend/apps/admin/src/features/posts/postForm.test.ts
git commit -m "Add post editor helper checks"
```

---

### Task 2: Add Publish Panel Component Test Coverage

**Files:**
- Create: `frontend/apps/admin/src/views/PostPublishPanel.vue`
- Create: `frontend/apps/admin/src/views/PostPublishPanel.test.ts`

- [ ] **Step 1: Write the failing component tests**

Create `frontend/apps/admin/src/views/PostPublishPanel.test.ts` with:

```ts
import { mount } from "@vue/test-utils";
import ElementPlus from "element-plus";
import { describe, expect, it } from "vitest";
import PostPublishPanel from "./PostPublishPanel.vue";

const categories = [{ id: 1, name: "Category", slug: "category", sortOrder: 0 }];
const tags = [{ id: 2, name: "Tag", slug: "tag" }];
const mediaAssets = [
  {
    id: 7,
    originalName: "cover.png",
    storedName: "cover.png",
    url: "/uploads/cover.png",
    mimeType: "image/png",
    size: 100,
    createdAt: "2026-05-18T00:00:00Z"
  }
];

function mountPanel() {
  return mount(PostPublishPanel, {
    global: { plugins: [ElementPlus] },
    props: {
      form: {
        title: "Title",
        slug: "title",
        summary: "",
        contentHtml: "<p></p>",
        coverMediaId: null,
        status: "DRAFT",
        categoryId: null,
        tagIds: []
      },
      checks: [
        { key: "title", label: "标题", level: "required", passed: true },
        { key: "content", label: "正文", level: "required", passed: false },
        { key: "summary", label: "摘要", level: "recommended", passed: false }
      ],
      categories,
      tags,
      mediaAssets,
      selectedCover: null,
      saveStatusText: "未保存 · 0 字 · 草稿",
      recoveryAvailable: true
    }
  });
}

describe("PostPublishPanel", () => {
  it("renders save status, publish checks, and recovery actions", () => {
    const wrapper = mountPanel();

    expect(wrapper.text()).toContain("未保存 · 0 字 · 草稿");
    expect(wrapper.text()).toContain("发布检查");
    expect(wrapper.text()).toContain("标题");
    expect(wrapper.text()).toContain("正文");
    expect(wrapper.text()).toContain("建议完善");
    expect(wrapper.text()).toContain("恢复本地草稿");
    expect(wrapper.text()).toContain("丢弃本地草稿");
  });

  it("emits recovery events from the recovery buttons", async () => {
    const wrapper = mountPanel();

    await wrapper.get('[data-test="restore-recovery"]').trigger("click");
    await wrapper.get('[data-test="discard-recovery"]').trigger("click");

    expect(wrapper.emitted("restore-recovery")).toHaveLength(1);
    expect(wrapper.emitted("discard-recovery")).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run the panel test and verify it fails because the component is missing**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/admin test -- src/views/PostPublishPanel.test.ts
```

Expected result: FAIL with import error for `PostPublishPanel.vue`.

- [ ] **Step 3: Create the publish panel component**

Create `frontend/apps/admin/src/views/PostPublishPanel.vue` with:

```vue
<template>
  <aside class="publish-panel" aria-label="文章发布设置">
    <section class="publish-card">
      <p class="publish-status">{{ saveStatusText }}</p>
      <div v-if="recoveryAvailable" class="recovery-actions">
        <span>发现本地草稿</span>
        <el-button data-test="restore-recovery" size="small" @click="$emit('restore-recovery')">恢复本地草稿</el-button>
        <el-button data-test="discard-recovery" size="small" @click="$emit('discard-recovery')">丢弃本地草稿</el-button>
      </div>
    </section>

    <section class="publish-card">
      <h2>发布检查</h2>
      <ul class="publish-checks">
        <li v-for="check in checks" :key="check.key" :class="{ passed: check.passed, warning: !check.passed && check.level === 'recommended' }">
          <span>{{ check.passed ? "通过" : check.level === "required" ? "必填" : "建议完善" }}</span>
          <strong>{{ check.label }}</strong>
        </li>
      </ul>
    </section>

    <section class="publish-card">
      <h2>发布设置</h2>
      <el-form label-position="top" class="publish-form">
        <el-form-item label="状态">
          <el-select :model-value="form.status" @update:model-value="updateField('status', $event)">
            <el-option label="草稿" value="DRAFT" />
            <el-option label="已发布" value="PUBLISHED" />
          </el-select>
        </el-form-item>

        <el-form-item label="URL 标识">
          <el-input :model-value="form.slug" aria-label="URL 标识" @update:model-value="updateField('slug', $event)" />
        </el-form-item>

        <el-form-item label="摘要">
          <el-input :model-value="form.summary" aria-label="摘要" type="textarea" :rows="4" @update:model-value="updateField('summary', $event)" />
        </el-form-item>

        <el-form-item label="封面图">
          <el-select :model-value="form.coverMediaId" clearable placeholder="选择媒体库图片" @update:model-value="updateField('coverMediaId', $event)">
            <el-option v-for="asset in mediaAssets" :key="asset.id" :label="asset.originalName" :value="asset.id" />
          </el-select>
          <div class="cover-preview">
            <img v-if="selectedCover" :src="selectedCover.url" :alt="selectedCover.originalName" />
            <span v-else>未选择封面图</span>
          </div>
        </el-form-item>

        <el-form-item label="分类">
          <el-select :model-value="form.categoryId" clearable @update:model-value="updateField('categoryId', $event)">
            <el-option v-for="category in categories" :key="category.id" :label="category.name" :value="category.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="标签">
          <el-select :model-value="form.tagIds" multiple @update:model-value="updateField('tagIds', $event)">
            <el-option v-for="tag in tags" :key="tag.id" :label="tag.name" :value="tag.id" />
          </el-select>
        </el-form-item>
      </el-form>
    </section>
  </aside>
</template>

<script setup lang="ts">
import type { Category, MediaAsset, Tag } from "@blog/shared";
import type { PostForm, PublishCheck } from "../features/posts/postForm";

const props = defineProps<{
  form: PostForm;
  checks: PublishCheck[];
  categories: Category[];
  tags: Tag[];
  mediaAssets: MediaAsset[];
  selectedCover: MediaAsset | null;
  saveStatusText: string;
  recoveryAvailable: boolean;
}>();

const emit = defineEmits<{
  "update:form": [value: PostForm];
  "restore-recovery": [];
  "discard-recovery": [];
}>();

function updateField<K extends keyof PostForm>(field: K, value: PostForm[K]) {
  emit("update:form", { ...props.form, [field]: value });
}
</script>

<style scoped>
.publish-panel {
  display: grid;
  gap: 12px;
  align-content: start;
}

.publish-card {
  background: #fffaf0;
  border: 2px solid var(--ink);
  display: grid;
  gap: 10px;
  padding: 12px;
}

.publish-card h2,
.publish-status {
  font-size: 15px;
  font-weight: 900;
  margin: 0;
}

.recovery-actions {
  border-top: 2px solid var(--ink);
  display: grid;
  gap: 8px;
  padding-top: 10px;
}

.publish-checks {
  display: grid;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.publish-checks li {
  align-items: center;
  border: 1px solid var(--ink);
  display: flex;
  gap: 8px;
  justify-content: space-between;
  padding: 8px;
}

.publish-checks span {
  background: var(--red);
  color: #fffaf0;
  font-size: 12px;
  font-weight: 900;
  padding: 2px 6px;
}

.publish-checks .passed span {
  background: var(--blue);
}

.publish-checks .warning span {
  background: var(--yellow);
  color: var(--ink);
}

.publish-form {
  display: grid;
  gap: 8px;
}

.cover-preview {
  align-items: center;
  background: #f4f0e8;
  border: 2px dashed var(--blue);
  color: var(--blue);
  display: grid;
  font-weight: 900;
  min-height: 96px;
  overflow: hidden;
  padding: 10px;
  place-items: center;
  text-align: center;
  width: 100%;
}

.cover-preview img {
  display: block;
  max-height: 150px;
  max-width: 100%;
  object-fit: cover;
}
</style>
```

- [ ] **Step 4: Run the panel test and verify it passes**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/admin test -- src/views/PostPublishPanel.test.ts
```

Expected result: PASS for `PostPublishPanel.test.ts`.

- [ ] **Step 5: Commit the panel**

Run:

```powershell
git add frontend/apps/admin/src/views/PostPublishPanel.vue frontend/apps/admin/src/views/PostPublishPanel.test.ts
git commit -m "Add post publish panel"
```

---

### Task 3: Add Editor View Tests For Preview And Publish Blocking

**Files:**
- Modify: `frontend/apps/admin/src/views/PostEditorView.test.ts`
- Later modify: `frontend/apps/admin/src/views/PostEditorView.vue`

- [ ] **Step 1: Extend TipTap mock for preview content**

In `frontend/apps/admin/src/views/PostEditorView.test.ts`, keep the current TipTap mock but ensure `getHTML` returns content with text:

```ts
getHTML: () => "<p>你好 world</p>",
getText: () => "你好 world",
```

- [ ] **Step 2: Add a test for edit/preview toggle**

Append this test inside `describe("PostEditorView", () => { ... })`:

```ts
it("switches between editor and in-page preview", async () => {
  const wrapper = mountEditor();
  await flushPromises();

  await wrapper.find('input[aria-label="标题"]').setValue("Preview title");
  await wrapper.find('input[aria-label="URL 标识"]').setValue("preview-title");
  await wrapper.find('[data-test="preview-mode"]').trigger("click");
  await flushPromises();

  expect(wrapper.text()).toContain("文章预览");
  expect(wrapper.text()).toContain("Preview title");
  expect(wrapper.find(".editor-surface").exists()).toBe(false);

  await wrapper.find('[data-test="edit-mode"]').trigger("click");
  await flushPromises();

  expect(wrapper.find(".editor-surface").exists()).toBe(true);
});
```

- [ ] **Step 3: Add a test for publish blocking on required checks**

Append:

```ts
it("blocks publishing when required publish checks fail", async () => {
  const wrapper = mountEditor();
  await flushPromises();

  await wrapper.find('[data-test="publish-post"]').trigger("click");
  await flushPromises();

  expect(createPostMock).not.toHaveBeenCalled();
  expect(wrapper.text()).toContain("请先完成必填发布检查");
});
```

- [ ] **Step 4: Run the editor tests and verify they fail for missing UI**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/admin test -- src/views/PostEditorView.test.ts
```

Expected result: FAIL because `preview-mode`, `edit-mode`, preview rendering, or publish blocking is missing.

- [ ] **Step 5: Implement minimal preview and publish-blocking state**

In `frontend/apps/admin/src/views/PostEditorView.vue`, add imports from the helper file:

```ts
import {
  postFormSnapshot,
  publishChecklist,
  toPostInput,
  validatePostForm,
  wordCountFromHtml,
  type PostForm
} from "../features/posts/postForm";
```

Add state and computed values near the existing refs:

```ts
type EditorMode = "edit" | "preview";

const activeMode = ref<EditorMode>("edit");
const publishCheckError = ref("");
const publishChecks = computed(() => publishChecklist(form));
const hasBlockingPublishChecks = computed(() => publishChecks.value.some((check) => check.level === "required" && !check.passed));
```

At the start of `save(status?: Post["status"])`, before setting `form.status`, add:

```ts
publishCheckError.value = "";
if (status === "PUBLISHED" && hasBlockingPublishChecks.value) {
  publishCheckError.value = "请先完成必填发布检查";
  saveState.value = "error";
  return;
}
```

Add an alert in the template after the existing save error alert:

```vue
<el-alert v-if="publishCheckError" type="error" :title="publishCheckError" :closable="false" />
```

Add the edit/preview control above the toolbar:

```vue
<el-segmented
  v-model="activeMode"
  :options="[
    { label: '编辑', value: 'edit' },
    { label: '预览', value: 'preview' }
  ]"
  aria-label="编辑模式"
/>
<div class="mode-actions">
  <el-button data-test="edit-mode" @click="activeMode = 'edit'">编辑</el-button>
  <el-button data-test="preview-mode" @click="activeMode = 'preview'">预览</el-button>
</div>
```

Wrap the toolbar and editor:

```vue
<template v-if="activeMode === 'edit'">
  <div class="toolbar" aria-label="文章编辑工具栏">
    <!-- keep existing toolbar buttons -->
  </div>
  <EditorContent v-if="editor" class="editor-surface" :editor="editor" />
</template>
<article v-else class="editor-preview" aria-label="文章预览">
  <p class="preview-kicker">文章预览</p>
  <h2>{{ form.title || "未命名文章" }}</h2>
  <p v-if="form.summary" class="preview-summary">{{ form.summary }}</p>
  <img v-if="selectedCover" :src="selectedCover.url" :alt="selectedCover.originalName" />
  <div class="preview-content" v-html="form.contentHtml"></div>
</article>
```

Add scoped CSS:

```css
.mode-actions {
  display: none;
}

.editor-preview {
  background: #fffaf0;
  border: 2px solid var(--ink);
  display: grid;
  gap: 12px;
  min-height: 260px;
  padding: 18px;
}

.editor-preview h2 {
  font-family: "Archivo Black", "Arial Black", sans-serif;
  font-size: 34px;
  line-height: 1;
  margin: 0;
}

.preview-kicker,
.preview-summary {
  font-weight: 900;
  margin: 0;
}

.editor-preview img {
  border: 2px solid var(--ink);
  max-height: 260px;
  max-width: 100%;
  object-fit: cover;
}

.preview-content :deep(p) {
  line-height: 1.7;
}
```

- [ ] **Step 6: Run the editor tests and verify they pass**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/admin test -- src/views/PostEditorView.test.ts
```

Expected result: PASS for `PostEditorView.test.ts`.

- [ ] **Step 7: Commit preview and publish blocking**

Run:

```powershell
git add frontend/apps/admin/src/views/PostEditorView.vue frontend/apps/admin/src/views/PostEditorView.test.ts
git commit -m "Add post editor preview checks"
```

---

### Task 4: Integrate The Right-Side Publish Panel Layout

**Files:**
- Modify: `frontend/apps/admin/src/views/PostEditorView.vue`
- Modify: `frontend/apps/admin/src/views/PostEditorView.test.ts`

- [ ] **Step 1: Write a failing test for right-side publishing controls**

Append this test to `frontend/apps/admin/src/views/PostEditorView.test.ts`:

```ts
it("renders publishing metadata in the right-side workbench panel", async () => {
  const wrapper = mountEditor();
  await flushPromises();

  expect(wrapper.find(".writing-workbench").exists()).toBe(true);
  expect(wrapper.find(".writing-main").exists()).toBe(true);
  expect(wrapper.find(".publish-panel").exists()).toBe(true);
  expect(wrapper.text()).toContain("发布检查");
  expect(wrapper.text()).toContain("发布设置");
});
```

- [ ] **Step 2: Run the editor tests and verify the new test fails**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/admin test -- src/views/PostEditorView.test.ts
```

Expected result: FAIL because the workbench classes or panel are not wired into `PostEditorView.vue`.

- [ ] **Step 3: Import and render `PostPublishPanel`**

Add import:

```ts
import PostPublishPanel from "./PostPublishPanel.vue";
```

Add this update function:

```ts
function updateForm(nextForm: PostForm) {
  Object.assign(form, nextForm);
}
```

Replace the old single-column form body with this structure:

```vue
<el-form label-position="top" class="editor-form">
  <div class="writing-workbench">
    <div class="writing-main">
      <el-form-item label="标题">
        <el-input v-model="form.title" aria-label="标题" @blur="syncSlug" />
      </el-form-item>

      <template v-if="activeMode === 'edit'">
        <!-- keep mode switch, toolbar, and EditorContent here -->
      </template>
      <article v-else class="editor-preview" aria-label="文章预览">
        <!-- keep preview content here -->
      </article>
    </div>

    <PostPublishPanel
      :form="form"
      :checks="publishChecks"
      :categories="categories"
      :tags="tags"
      :media-assets="mediaAssets"
      :selected-cover="selectedCover"
      :save-status-text="editorStatusText"
      :recovery-available="Boolean(recoverySnapshot)"
      @update:form="updateForm"
      @restore-recovery="restoreRecovery"
      @discard-recovery="discardRecovery"
    />
  </div>
</el-form>
```

When moving fields, remove the previous `editor-primary-grid`, `editor-inline-grid`, and `editor-meta-grid` sections from the template. The title stays in the main column; slug, summary, cover, category, tags, and status move into `PostPublishPanel`.

Add temporary stubs for recovery handlers if Task 5 has not yet implemented them:

```ts
const recoverySnapshot = ref<null>(null);

function restoreRecovery() {
  recoverySnapshot.value = null;
}

function discardRecovery() {
  recoverySnapshot.value = null;
}
```

Replace those stubs in Task 5.

Add scoped CSS:

```css
.writing-workbench {
  align-items: start;
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 340px);
}

.writing-main {
  display: grid;
  gap: 12px;
  min-width: 0;
}

@media (max-width: 980px) {
  .writing-workbench {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Run view and panel tests**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/admin test -- src/views/PostEditorView.test.ts src/views/PostPublishPanel.test.ts
```

Expected result: PASS for both test files.

- [ ] **Step 5: Commit the workbench layout**

Run:

```powershell
git add frontend/apps/admin/src/views/PostEditorView.vue frontend/apps/admin/src/views/PostEditorView.test.ts
git commit -m "Arrange post editor workbench"
```

---

### Task 5: Add Local Draft Recovery

**Files:**
- Modify: `frontend/apps/admin/src/views/PostEditorView.test.ts`
- Modify: `frontend/apps/admin/src/views/PostEditorView.vue`

- [ ] **Step 1: Add tests for recovery restore and discard**

Append to `PostEditorView.test.ts`:

```ts
it("restores a newer local recovery draft", async () => {
  window.localStorage.setItem(
    "post-editor:new",
    JSON.stringify({
      updatedAt: Date.now() + 1000,
      form: {
        title: "Recovered title",
        slug: "recovered-title",
        summary: "Recovered summary",
        contentHtml: "<p>Recovered content</p>",
        coverMediaId: null,
        status: "DRAFT",
        categoryId: null,
        tagIds: [],
        publishedAt: null
      }
    })
  );

  const wrapper = mountEditor();
  await flushPromises();

  expect(wrapper.text()).toContain("发现本地草稿");
  await wrapper.find('[data-test="restore-recovery"]').trigger("click");
  await flushPromises();

  expect((wrapper.find('input[aria-label="标题"]').element as HTMLInputElement).value).toBe("Recovered title");
});

it("discards a local recovery draft", async () => {
  window.localStorage.setItem(
    "post-editor:new",
    JSON.stringify({
      updatedAt: Date.now() + 1000,
      form: {
        title: "Recovered title",
        slug: "recovered-title",
        summary: "",
        contentHtml: "<p>Recovered content</p>",
        coverMediaId: null,
        status: "DRAFT",
        categoryId: null,
        tagIds: [],
        publishedAt: null
      }
    })
  );

  const wrapper = mountEditor();
  await flushPromises();

  await wrapper.find('[data-test="discard-recovery"]').trigger("click");
  await flushPromises();

  expect(window.localStorage.getItem("post-editor:new")).toBeNull();
  expect(wrapper.text()).not.toContain("发现本地草稿");
});
```

In the `beforeEach`, add:

```ts
window.localStorage.clear();
```

- [ ] **Step 2: Run editor tests and verify recovery tests fail**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/admin test -- src/views/PostEditorView.test.ts
```

Expected result: FAIL because recovery loading and restore/discard behavior is not implemented.

- [ ] **Step 3: Import recovery helpers**

Update the import from `postForm`:

```ts
import {
  postFormSnapshot,
  postRecoveryKey,
  postRecoverySnapshot,
  publishChecklist,
  toPostInput,
  validatePostForm,
  wordCountFromHtml,
  type PostForm,
  type PostRecoverySnapshot
} from "../features/posts/postForm";
```

- [ ] **Step 4: Implement recovery state and helpers**

Replace the temporary `recoverySnapshot` stub with:

```ts
const recoverySnapshot = ref<PostRecoverySnapshot | null>(null);
const loadedAt = ref(Date.now());
const recoveryKey = computed(() => postRecoveryKey(isNew.value ? null : route.params.id?.toString()));
```

Add these functions:

```ts
function applyFormSnapshot(nextForm: PostForm) {
  Object.assign(form, {
    title: nextForm.title ?? "",
    slug: nextForm.slug ?? "",
    summary: nextForm.summary ?? "",
    contentHtml: nextForm.contentHtml ?? "",
    coverMediaId: nextForm.coverMediaId ?? null,
    status: nextForm.status ?? "DRAFT",
    categoryId: nextForm.categoryId ?? null,
    tagIds: nextForm.tagIds ?? [],
    publishedAt: nextForm.publishedAt ?? null
  });
  editor.value?.commands.setContent(form.contentHtml ?? "");
}

function loadRecoverySnapshot() {
  try {
    const raw = window.localStorage.getItem(recoveryKey.value);
    if (!raw) {
      recoverySnapshot.value = null;
      return;
    }
    const parsed = JSON.parse(raw) as PostRecoverySnapshot;
    recoverySnapshot.value = parsed.updatedAt > loadedAt.value ? parsed : null;
  } catch {
    window.localStorage.removeItem(recoveryKey.value);
    recoverySnapshot.value = null;
  }
}

function writeRecoverySnapshot() {
  window.localStorage.setItem(recoveryKey.value, JSON.stringify(postRecoverySnapshot(form)));
}

function clearRecoverySnapshot() {
  window.localStorage.removeItem(recoveryKey.value);
  recoverySnapshot.value = null;
}

function restoreRecovery() {
  if (!recoverySnapshot.value) {
    return;
  }
  applyFormSnapshot(recoverySnapshot.value.form);
  refreshSavedSnapshot();
  recoverySnapshot.value = null;
}

function discardRecovery() {
  clearRecoverySnapshot();
}
```

In the existing form watcher, after the save-state logic, call:

```ts
writeRecoverySnapshot();
```

After the server post load completes in `onMounted`, set:

```ts
loadedAt.value = Date.now();
loadRecoverySnapshot();
```

After successful save in `save`, call:

```ts
clearRecoverySnapshot();
```

- [ ] **Step 5: Run editor tests and verify recovery passes**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/admin test -- src/views/PostEditorView.test.ts
```

Expected result: PASS for recovery tests and existing editor tests.

- [ ] **Step 6: Commit recovery behavior**

Run:

```powershell
git add frontend/apps/admin/src/views/PostEditorView.vue frontend/apps/admin/src/views/PostEditorView.test.ts
git commit -m "Add post editor recovery"
```

---

### Task 6: Add Autosave

**Files:**
- Modify: `frontend/apps/admin/src/views/PostEditorView.test.ts`
- Modify: `frontend/apps/admin/src/views/PostEditorView.vue`

- [ ] **Step 1: Add autosave tests with fake timers**

In `beforeEach`, add:

```ts
vi.useFakeTimers();
```

Add `afterEach` to the describe block:

```ts
afterEach(() => {
  vi.useRealTimers();
});
```

Append tests:

```ts
it("autosaves a valid new draft after edits settle", async () => {
  createPostMock.mockResolvedValue({ id: 22 });
  const wrapper = mountEditor();
  await flushPromises();

  await wrapper.find('input[aria-label="标题"]').setValue("Autosave title");
  await wrapper.find('input[aria-label="URL 标识"]').setValue("autosave-title");
  await vi.advanceTimersByTimeAsync(1300);
  await flushPromises();

  expect(createPostMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Autosave title", status: "DRAFT" }));
  expect(replaceMock).toHaveBeenCalledWith("/posts/22");
});

it("does not autosave a new draft before slug is valid", async () => {
  const wrapper = mountEditor();
  await flushPromises();

  await wrapper.find('input[aria-label="标题"]').setValue("Autosave title");
  await vi.advanceTimersByTimeAsync(1300);
  await flushPromises();

  expect(createPostMock).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run editor tests and verify autosave tests fail**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/admin test -- src/views/PostEditorView.test.ts
```

Expected result: FAIL because autosave is not implemented.

- [ ] **Step 3: Import autosave helper and add save mode**

Update import:

```ts
import {
  canAutosavePost,
  postFormSnapshot,
  postRecoveryKey,
  postRecoverySnapshot,
  publishChecklist,
  toPostInput,
  validatePostForm,
  wordCountFromHtml,
  type PostForm,
  type PostRecoverySnapshot
} from "../features/posts/postForm";
```

Add types and refs:

```ts
type SaveMode = "manual" | "autosave";

let autosaveTimer: ReturnType<typeof window.setTimeout> | null = null;
const saveMode = ref<SaveMode>("manual");
const lastAutosavedAt = ref("");
```

- [ ] **Step 4: Split save into manual and autosave flows**

Change `save` to:

```ts
async function save(status?: Post["status"], mode: SaveMode = "manual") {
  saveMode.value = mode;
  publishCheckError.value = "";
  if (status === "PUBLISHED" && hasBlockingPublishChecks.value) {
    publishCheckError.value = "请先完成必填发布检查";
    saveState.value = "error";
    return;
  }
  if (status) {
    form.status = status;
  }
  errors.value = validatePostForm(form);
  saveError.value = "";
  if (errors.value.length) {
    return;
  }

  saveState.value = "saving";
  try {
    const saved = isNew.value
      ? await adminApi.createPost(toPostInput({ ...form, status: mode === "autosave" ? "DRAFT" : form.status }))
      : await adminApi.updatePost(Number(route.params.id), toPostInput(form));
    refreshSavedSnapshot();
    if (mode === "autosave") {
      lastAutosavedAt.value = lastSavedAt.value;
    }
    saveState.value = "saved";
    clearRecoverySnapshot();
    if (isNew.value && saved.id) {
      await router.replace(`/posts/${saved.id}`);
    }
  } catch (err) {
    saveState.value = "error";
    saveError.value = mode === "autosave" ? `自动保存失败：${errorMessage(err)}` : errorMessage(err);
  }
}
```

Add:

```ts
function queueAutosave() {
  if (autosaveTimer) {
    window.clearTimeout(autosaveTimer);
  }
  autosaveTimer = window.setTimeout(() => {
    autosaveTimer = null;
    if (saveState.value === "saving" || !isDirty.value || !canAutosavePost(form, { isNew: isNew.value })) {
      return;
    }
    void save(undefined, "autosave");
  }, 1200);
}
```

In the form watcher, after `writeRecoverySnapshot();`, add:

```ts
queueAutosave();
```

In `onBeforeUnmount`, add:

```ts
if (autosaveTimer) {
  window.clearTimeout(autosaveTimer);
}
```

- [ ] **Step 5: Update save status text to distinguish autosave**

In `editorStatusText`, replace the saved branch with:

```ts
if (saveState.value === "saved") {
  const label = saveMode.value === "autosave" ? "已自动保存" : "已保存";
  return `${label}${lastSavedAt.value ? ` ${lastSavedAt.value}` : ""} · ${wordCount.value} 字 · ${status}`;
}
```

- [ ] **Step 6: Run editor tests and verify autosave passes**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/admin test -- src/views/PostEditorView.test.ts
```

Expected result: PASS for autosave tests and existing editor tests.

- [ ] **Step 7: Commit autosave behavior**

Run:

```powershell
git add frontend/apps/admin/src/views/PostEditorView.vue frontend/apps/admin/src/views/PostEditorView.test.ts
git commit -m "Add post editor autosave"
```

---

### Task 7: Polish Accessibility, Responsive Layout, And Full Verification

**Files:**
- Modify: `frontend/apps/admin/src/views/PostEditorView.vue`
- Modify: `frontend/apps/admin/src/views/PostPublishPanel.vue`
- Modify tests only if verification exposes a behavior gap.

- [ ] **Step 1: Run the full admin test suite**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/admin test
```

Expected result: PASS for all admin test files.

- [ ] **Step 2: Run the admin build**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/admin build
```

Expected result: PASS for `vue-tsc --noEmit` and `vite build --logLevel error`.

- [ ] **Step 3: Start the admin dev server for browser verification**

Use the existing project server if it is already running. If it is not running, start Vite from the Node runtime or an approved shell command on port `5173` or another free port.

Expected result: editor reachable at a URL such as `http://localhost:5173/admin/posts/new`.

- [ ] **Step 4: Verify desktop layout in the in-app browser**

Open the new post editor and check:

- Main writing column is visually dominant.
- Right publish panel is visible and does not overlap the editor.
- Edit/preview switch works.
- Publish checklist shows required and recommended state text.
- Save/autosave status is visible.

Save screenshot to:

```text
D:\work\demo\blog\logs\focus-writing-workbench-desktop.png
```

- [ ] **Step 5: Verify mobile layout in the in-app browser**

Set a narrow viewport or use browser tooling and check:

- The publish panel stacks below the writing area.
- Buttons do not overflow.
- Toolbar wraps cleanly.
- Preview content remains readable.

Save screenshot to:

```text
D:\work\demo\blog\logs\focus-writing-workbench-mobile.png
```

- [ ] **Step 6: Fix only issues found by verification**

If TypeScript, tests, or browser verification fail, write a failing test when the issue is behavioral. For pure CSS overlap or responsive defects, make the smallest scoped style change in `PostEditorView.vue` or `PostPublishPanel.vue`.

Acceptable style fixes include:

```css
.editor-actions {
  align-items: center;
}

.toolbar .el-button {
  min-width: 40px;
}

.publish-panel {
  min-width: 0;
}
```

- [ ] **Step 7: Re-run verification after any fix**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/admin test
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/admin build
```

Expected result: PASS for both commands.

- [ ] **Step 8: Commit final polish**

Run:

```powershell
git add frontend/apps/admin/src/views/PostEditorView.vue frontend/apps/admin/src/views/PostPublishPanel.vue frontend/apps/admin/src/views/PostEditorView.test.ts frontend/apps/admin/src/views/PostPublishPanel.test.ts
git commit -m "Polish focused writing workbench"
```

If there were no changes after Task 6, skip this commit.

---

## Plan Self-Review

- Spec coverage: helper checks, preview, autosave, local recovery, publish checks, right-side metadata panel, responsive verification, and existing API boundaries are covered by Tasks 1-7.
- Scope check: no backend revisions, no chapter workflow, no collaborative editing, no full block editor.
- Placeholder scan: no unfinished implementation notes remain; the only `placeholder` text is the intended Element Plus input attribute.
- Type consistency: `PostForm`, `PublishCheck`, `PostRecoverySnapshot`, `SaveMode`, and `EditorMode` names are introduced before use and reused consistently.
