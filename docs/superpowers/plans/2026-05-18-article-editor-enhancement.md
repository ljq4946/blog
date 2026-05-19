# Article Editor Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the admin article editor with a practical writing toolbar, cover media selection, save feedback, dirty-state protection, and word count.

**Architecture:** Keep the implementation in the existing Vue admin app. Add pure helpers to `features/posts/postForm.ts` for testable word-count and dirty-state snapshots, then update `PostEditorView.vue` to use those helpers while preserving the current TipTap, Element Plus, and REST API flow.

**Tech Stack:** Vue 3, TypeScript, Vue Router, Element Plus, TipTap, Vitest, Vue Test Utils, pnpm workspace.

---

## File Structure

- Modify `frontend/apps/admin/src/features/posts/postForm.ts`: add pure helpers for word count and normalized snapshots.
- Modify `frontend/apps/admin/src/features/posts/postForm.test.ts`: add TDD coverage for helpers.
- Create `frontend/apps/admin/src/views/PostEditorView.test.ts`: cover save feedback, failed save, and enhanced editor controls with mocks.
- Modify `frontend/apps/admin/src/views/PostEditorView.vue`: implement toolbar, cover selector, save state, dirty guards, and layout polish.
- Modify `frontend/apps/admin/src/styles.css` only if shared editor surface styles are needed.

## Task 1: Add Testable Form Helpers

**Files:**

- Modify: `frontend/apps/admin/src/features/posts/postForm.test.ts`
- Modify: `frontend/apps/admin/src/features/posts/postForm.ts`

- [ ] **Step 1: Write failing tests for word count and snapshots**

Add these tests below the existing validation test:

```ts
import { postFormSnapshot, wordCountFromHtml } from "./postForm";

it("counts Chinese characters and latin words from editor HTML", () => {
  expect(wordCountFromHtml("<p>你好 world</p><p>Vue 3</p>")).toBe(5);
  expect(wordCountFromHtml("<p><br></p>")).toBe(0);
});

it("normalizes snapshots so equivalent tag order is not dirty", () => {
  expect(
    postFormSnapshot({
      title: " Hello ",
      slug: "hello",
      summary: "",
      contentHtml: "<p>Hello</p>",
      status: "DRAFT",
      categoryId: null,
      tagIds: [3, 1],
      coverMediaId: null
    })
  ).toEqual(
    postFormSnapshot({
      title: "Hello",
      slug: "hello",
      summary: "",
      contentHtml: "<p>Hello</p>",
      status: "DRAFT",
      categoryId: null,
      tagIds: [1, 3],
      coverMediaId: null
    })
  );
});
```

- [ ] **Step 2: Run helper tests and verify they fail**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/admin test -- src/features/posts/postForm.test.ts
```

Expected: fail because `postFormSnapshot` and `wordCountFromHtml` are not exported.

- [ ] **Step 3: Implement the helpers**

Add these exports to `postForm.ts`:

```ts
export function wordCountFromHtml(html?: string | null) {
  const text = (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) {
    return 0;
  }

  const latinWords = text.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g) ?? [];
  const cjkCharacters = text.match(/[\u3400-\u9fff]/g) ?? [];
  return latinWords.length + cjkCharacters.length;
}

export function postFormSnapshot(form: PostForm) {
  return JSON.stringify({
    title: form.title?.trim() ?? "",
    slug: form.slug?.trim() ?? "",
    summary: form.summary ?? "",
    contentHtml: form.contentHtml ?? "",
    coverMediaId: form.coverMediaId ?? null,
    status: form.status ?? "DRAFT",
    categoryId: form.categoryId ?? null,
    tagIds: [...(form.tagIds ?? [])].sort((left, right) => left - right),
    publishedAt: form.publishedAt ?? null
  });
}
```

- [ ] **Step 4: Run helper tests and verify they pass**

Run the same `postForm.test.ts` command. Expected: all tests in the file pass.

## Task 2: Add View-Level Regression Tests

**Files:**

- Create: `frontend/apps/admin/src/views/PostEditorView.test.ts`
- Modify: `frontend/apps/admin/src/views/PostEditorView.vue`

- [ ] **Step 1: Write failing component tests**

Create `PostEditorView.test.ts` with mocked router, API, and TipTap:

```ts
import { flushPromises, mount } from "@vue/test-utils";
import ElementPlus from "element-plus";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PostEditorView from "./PostEditorView.vue";

const pushMock = vi.hoisted(() => vi.fn());
const replaceMock = vi.hoisted(() => vi.fn());
const routeMock = vi.hoisted(() => ({ params: {} as Record<string, string> }));
const createPostMock = vi.hoisted(() => vi.fn());
const updatePostMock = vi.hoisted(() => vi.fn());
const postsMock = vi.hoisted(() => vi.fn());
const categoriesMock = vi.hoisted(() => vi.fn());
const tagsMock = vi.hoisted(() => vi.fn());
const mediaMock = vi.hoisted(() => vi.fn());
const editorCommands = vi.hoisted(() => ({
  toggleBold: vi.fn(),
  toggleItalic: vi.fn(),
  toggleHeading: vi.fn(),
  toggleBulletList: vi.fn(),
  toggleBlockquote: vi.fn(),
  toggleCodeBlock: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
  setLink: vi.fn(),
  setImage: vi.fn(),
  unsetLink: vi.fn(),
  focus: vi.fn(),
  run: vi.fn(),
  setContent: vi.fn()
}));

vi.mock("vue-router", async () => {
  const actual = await vi.importActual<typeof import("vue-router")>("vue-router");
  return {
    ...actual,
    useRoute: () => routeMock,
    useRouter: () => ({ push: pushMock, replace: replaceMock })
  };
});

vi.mock("../lib/api", () => ({
  adminApi: {
    posts: postsMock,
    createPost: createPostMock,
    updatePost: updatePostMock,
    categories: categoriesMock,
    tags: tagsMock,
    media: mediaMock
  }
}));

vi.mock("@tiptap/vue-3", async () => {
  const { shallowRef } = await import("vue");
  const chain = () => editorCommands;
  Object.values(editorCommands).forEach((command) => command.mockImplementation(() => editor));
  const editor = {
    chain,
    commands: editorCommands,
    getHTML: () => "<p>你好 world</p>",
    getText: () => "你好 world",
    isActive: () => false,
    destroy: vi.fn()
  };
  return {
    EditorContent: { template: '<div class="editor-surface" />' },
    useEditor: () => shallowRef(editor)
  };
});

function mountEditor() {
  return mount(PostEditorView, {
    attachTo: document.body,
    global: {
      plugins: [ElementPlus]
    }
  });
}

describe("PostEditorView", () => {
  beforeEach(() => {
    routeMock.params = {};
    pushMock.mockReset();
    replaceMock.mockReset();
    createPostMock.mockReset();
    updatePostMock.mockReset();
    postsMock.mockResolvedValue([]);
    categoriesMock.mockResolvedValue([{ id: 1, name: "Category", slug: "category", sortOrder: 0 }]);
    tagsMock.mockResolvedValue([{ id: 2, name: "Tag", slug: "tag" }]);
    mediaMock.mockResolvedValue({
      content: [{ id: 7, originalName: "cover.png", storedName: "cover.png", url: "/uploads/cover.png", mimeType: "image/png", size: 100, createdAt: "2026-05-18T00:00:00Z" }],
      number: 0,
      size: 24,
      totalElements: 1,
      totalPages: 1
    });
    vi.stubGlobal("confirm", vi.fn(() => true));
    vi.stubGlobal("prompt", vi.fn(() => "https://example.com/image.png"));
  });

  it("renders the enhanced toolbar and writing metadata", async () => {
    const wrapper = mountEditor();
    await flushPromises();

    expect(wrapper.text()).toContain("未保存");
    expect(wrapper.text()).toContain("封面图");
    expect(wrapper.text()).toContain("链接");
    expect(wrapper.text()).toContain("图片");
    expect(wrapper.text()).toContain("代码");
    expect(wrapper.text()).toContain("撤销");
    expect(wrapper.text()).toContain("重做");
  });

  it("stays on the editor and shows save feedback after creating a draft", async () => {
    createPostMock.mockResolvedValue({ id: 12 });
    const wrapper = mountEditor();
    await flushPromises();

    await wrapper.find('input[aria-label="标题"]').setValue("Hello");
    await wrapper.find('input[aria-label="URL 标识"]').setValue("hello");
    await wrapper.find('[data-test="save-draft"]').trigger("click");
    await flushPromises();

    expect(createPostMock).toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith("/posts/12");
    expect(wrapper.text()).toContain("已保存");
  });

  it("keeps content in place and shows an error when saving fails", async () => {
    createPostMock.mockRejectedValue(new Error("Slug already exists"));
    const wrapper = mountEditor();
    await flushPromises();

    await wrapper.find('input[aria-label="标题"]').setValue("Hello");
    await wrapper.find('input[aria-label="URL 标识"]').setValue("hello");
    await wrapper.find('[data-test="save-draft"]').trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Slug already exists");
    expect(pushMock).not.toHaveBeenCalledWith("/posts");
  });
});
```

- [ ] **Step 2: Run the new view tests and verify they fail**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/admin test -- src/views/PostEditorView.test.ts
```

Expected: fail because enhanced toolbar text, save feedback, and `data-test="save-draft"` do not exist.

## Task 3: Implement Editor Layout And Behavior

**Files:**

- Modify: `frontend/apps/admin/src/views/PostEditorView.vue`

- [ ] **Step 1: Replace the template with the enhanced layout**

Add:

- Top action row with `返回`, `保存草稿`, and `发布文章`.
- Save status text with `未保存`, `保存中`, `已保存`, or `保存失败`.
- Cover media `el-select`.
- Toolbar buttons for `B`, `I`, `H2`, `H3`, `列表`, `引用`, `链接`, `图片`, `代码`, `撤销`, `重做`.
- `data-test="save-draft"` on draft save and `data-test="publish-post"` on publish save.
- `aria-label` on title and slug inputs for tests and accessibility.

- [ ] **Step 2: Add script state and commands**

Use `postFormSnapshot` and `wordCountFromHtml`. Track `lastSavedSnapshot`, `saveState`, `saveError`, `lastSavedAt`, and `mediaAssets`. Implement `save(status?: Post["status"])`, `insertLink()`, `insertImage()`, `confirmLeave()`, and route/browser unload guards.

- [ ] **Step 3: Add scoped CSS**

Keep the constructivist direction: square controls, strong black borders, paper surface, compact grid, responsive collapse under tablet width.

- [ ] **Step 4: Run view tests and helper tests**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/admin test -- src/features/posts/postForm.test.ts src/views/PostEditorView.test.ts
```

Expected: both test files pass.

## Task 4: Full Verification

**Files:**

- Verify only.

- [ ] **Step 1: Run admin tests**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/admin test
```

Expected: admin Vitest suite passes.

- [ ] **Step 2: Run admin build**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/admin build
```

Expected: `vue-tsc` and Vite build complete with exit code 0.

- [ ] **Step 3: Browser verify the editor**

Open `http://localhost:5173/admin/posts/new`, reload the app, and verify:

- The enhanced toolbar renders.
- The save actions are visible.
- The cover selector renders without overlapping the form.
- Desktop and narrow widths do not overlap text or controls.

- [ ] **Step 4: Review git diff**

Run:

```powershell
git diff -- frontend/apps/admin/src/features/posts/postForm.ts frontend/apps/admin/src/features/posts/postForm.test.ts frontend/apps/admin/src/views/PostEditorView.vue frontend/apps/admin/src/views/PostEditorView.test.ts docs/superpowers/plans/2026-05-18-article-editor-enhancement.md
```

Expected: diff is limited to the approved editor enhancement and this plan.
