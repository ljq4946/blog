# Article Reading Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the public article detail page with a comfortable reading layout, stronger prose rendering, table of contents, reading progress, code-block enhancements, back-to-top, and dark mode.

**Architecture:** Keep `PostDetailView.vue` as the route orchestrator and move focused behavior into small web-app components under `frontend/apps/web/src/components/reading`. Put reusable DOM and state helpers in `frontend/apps/web/src/features/reading/articleEnhancements.ts` so heading IDs, table-of-contents extraction, reading progress, and theme persistence are testable without mounting the full page.

**Tech Stack:** Vue 3, Vue Router, TypeScript, Vitest, Vue Test Utils, jsdom, existing `@blog/shared` DTOs, and `highlight.js` for client-side code highlighting.

---

## File Structure

- Create `frontend/apps/web/src/features/reading/articleEnhancements.ts`: pure helpers for heading slug generation, TOC extraction, reading progress calculation, and reading theme persistence.
- Create `frontend/apps/web/src/features/reading/articleEnhancements.test.ts`: unit coverage for the reading helpers.
- Create `frontend/apps/web/src/components/reading/ArticleRenderer.vue`: renders article HTML, applies heading IDs, emits TOC entries, highlights code blocks, and adds copy buttons.
- Create `frontend/apps/web/src/components/reading/ArticleRenderer.test.ts`: component coverage for TOC emission, duplicate heading IDs, and copy-code behavior.
- Create `frontend/apps/web/src/components/reading/ArticleToc.vue`: renders article table of contents and emits navigation requests.
- Create `frontend/apps/web/src/components/reading/ArticleToc.test.ts`: component coverage for TOC rendering and click behavior.
- Create `frontend/apps/web/src/components/reading/ReadingProgress.vue`: renders top-page reading progress and updates on scroll.
- Create `frontend/apps/web/src/components/reading/ReadingProgress.test.ts`: component coverage for scroll-driven progress.
- Create `frontend/apps/web/src/components/reading/ReadingPreferences.vue`: renders dark-mode toggle and persists the setting.
- Create `frontend/apps/web/src/components/reading/ReadingPreferences.test.ts`: component coverage for persisted dark-mode state.
- Modify `frontend/apps/web/src/views/PostDetailView.vue`: load state, error state, article header, renderer, TOC, progress, preferences, and back-to-top.
- Create or modify `frontend/apps/web/src/views/PostDetailView.test.ts`: route-level coverage for article metadata, rendering, TOC integration, error state, and cover image.
- Modify `frontend/apps/web/src/styles.css`: article page layout, prose system, code blocks, TOC, progress bar, dark mode, and mobile responsiveness.
- Modify `frontend/apps/web/package.json` and `frontend/pnpm-lock.yaml`: add `highlight.js` to `@blog/web`.

## Commands

Use these commands from `D:\work\demo\blog`:

- Add highlighter dependency: `node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web add highlight.js`
- Web tests: `node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web test`
- Web build: `node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web build`
- Web dev server: `node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web dev`

---

### Task 1: Add Reading Helper Tests And Utilities

**Files:**
- Create: `frontend/apps/web/src/features/reading/articleEnhancements.test.ts`
- Create: `frontend/apps/web/src/features/reading/articleEnhancements.ts`

- [ ] **Step 1: Write failing helper tests**

Create `frontend/apps/web/src/features/reading/articleEnhancements.test.ts` with:

```ts
import { describe, expect, it, vi } from "vitest";
import {
  READING_THEME_KEY,
  applyHeadingIds,
  calculateReadingProgress,
  readStoredTheme,
  writeStoredTheme
} from "./articleEnhancements";

describe("applyHeadingIds", () => {
  it("extracts h2 and h3 headings and assigns stable duplicate ids", () => {
    const host = document.createElement("article");
    host.innerHTML = `
      <h1>Ignored title</h1>
      <h2>Setup Guide</h2>
      <p>Body</p>
      <h3>Install Vue 3</h3>
      <h2>Setup Guide</h2>
      <h4>Ignored deep heading</h4>
    `;

    const items = applyHeadingIds(host);

    expect(items).toEqual([
      { id: "setup-guide", text: "Setup Guide", level: 2 },
      { id: "install-vue-3", text: "Install Vue 3", level: 3 },
      { id: "setup-guide-2", text: "Setup Guide", level: 2 }
    ]);
    expect(host.querySelectorAll("h2")[0].id).toBe("setup-guide");
    expect(host.querySelector("h3")?.id).toBe("install-vue-3");
    expect(host.querySelectorAll("h2")[1].id).toBe("setup-guide-2");
  });

  it("uses fallback ids for empty headings", () => {
    const host = document.createElement("article");
    host.innerHTML = "<h2><span></span></h2><h3>   </h3>";

    expect(applyHeadingIds(host)).toEqual([
      { id: "section", text: "Section", level: 2 },
      { id: "section-2", text: "Section", level: 3 }
    ]);
  });
});

describe("calculateReadingProgress", () => {
  it("clamps progress between 0 and 100", () => {
    expect(calculateReadingProgress({ scrollY: -20, viewportHeight: 800, documentHeight: 2000 })).toBe(0);
    expect(calculateReadingProgress({ scrollY: 600, viewportHeight: 800, documentHeight: 2000 })).toBe(50);
    expect(calculateReadingProgress({ scrollY: 5000, viewportHeight: 800, documentHeight: 2000 })).toBe(100);
  });

  it("returns full progress when there is no scrollable distance", () => {
    expect(calculateReadingProgress({ scrollY: 0, viewportHeight: 1000, documentHeight: 800 })).toBe(100);
  });
});

describe("reading theme storage", () => {
  it("reads and writes the stored theme", () => {
    localStorage.clear();

    expect(readStoredTheme()).toBe("light");
    writeStoredTheme("dark");

    expect(localStorage.getItem(READING_THEME_KEY)).toBe("dark");
    expect(readStoredTheme()).toBe("dark");
  });

  it("falls back to light when localStorage throws", () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(readStoredTheme()).toBe("light");
    getItem.mockRestore();
  });
});
```

- [ ] **Step 2: Run helper tests and verify they fail**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web test -- src/features/reading/articleEnhancements.test.ts
```

Expected result: FAIL with an import error because `articleEnhancements.ts` does not exist.

- [ ] **Step 3: Implement reading helpers**

Create `frontend/apps/web/src/features/reading/articleEnhancements.ts` with:

```ts
export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface ReadingProgressInput {
  scrollY: number;
  viewportHeight: number;
  documentHeight: number;
}

export type ReadingTheme = "light" | "dark";

export const READING_THEME_KEY = "blog-reading-theme";

function normalizeHeadingText(text: string | null | undefined) {
  const normalized = (text ?? "").replace(/\s+/g, " ").trim();
  return normalized || "Section";
}

function slugifyHeading(text: string) {
  const slug = text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\u3400-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "section";
}

function uniqueSlug(base: string, counts: Map<string, number>) {
  const previous = counts.get(base) ?? 0;
  const next = previous + 1;
  counts.set(base, next);
  return next === 1 ? base : `${base}-${next}`;
}

export function applyHeadingIds(root: ParentNode): TocItem[] {
  const counts = new Map<string, number>();
  return Array.from(root.querySelectorAll("h2, h3")).map((heading) => {
    const text = normalizeHeadingText(heading.textContent);
    const id = uniqueSlug(slugifyHeading(text), counts);
    const level = heading.tagName.toLowerCase() === "h3" ? 3 : 2;

    if (heading instanceof HTMLElement) {
      heading.id = id;
      heading.tabIndex = -1;
    }

    return { id, text, level };
  });
}

export function calculateReadingProgress(input: ReadingProgressInput) {
  const scrollable = input.documentHeight - input.viewportHeight;
  if (scrollable <= 0) {
    return 100;
  }

  const rawProgress = (input.scrollY / scrollable) * 100;
  return Math.round(Math.min(100, Math.max(0, rawProgress)));
}

export function readStoredTheme(): ReadingTheme {
  try {
    return localStorage.getItem(READING_THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function writeStoredTheme(theme: ReadingTheme) {
  try {
    localStorage.setItem(READING_THEME_KEY, theme);
  } catch {
    // Theme still applies for the current page even when persistence is blocked.
  }
}
```

- [ ] **Step 4: Run helper tests and verify they pass**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web test -- src/features/reading/articleEnhancements.test.ts
```

Expected result: PASS for `articleEnhancements.test.ts`.

- [ ] **Step 5: Commit helper utilities**

Run:

```powershell
git add frontend/apps/web/src/features/reading/articleEnhancements.ts frontend/apps/web/src/features/reading/articleEnhancements.test.ts
git commit -m "Add article reading helpers"
```

---

### Task 2: Add Article Renderer With TOC And Code Enhancements

**Files:**
- Modify: `frontend/apps/web/package.json`
- Modify: `frontend/pnpm-lock.yaml`
- Create: `frontend/apps/web/src/components/reading/ArticleRenderer.test.ts`
- Create: `frontend/apps/web/src/components/reading/ArticleRenderer.vue`

- [ ] **Step 1: Add the code highlighter dependency**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web add highlight.js
```

Expected result: `highlight.js` is added to `frontend/apps/web/package.json`, and `frontend/pnpm-lock.yaml` is updated.

- [ ] **Step 2: Write failing ArticleRenderer tests**

Create `frontend/apps/web/src/components/reading/ArticleRenderer.test.ts` with:

```ts
import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import ArticleRenderer from "./ArticleRenderer.vue";

describe("ArticleRenderer", () => {
  it("emits toc items and assigns duplicate heading ids", async () => {
    const wrapper = mount(ArticleRenderer, {
      props: {
        contentHtml: "<h2>Setup Guide</h2><p>Body</p><h3>Install Vue 3</h3><h2>Setup Guide</h2>"
      }
    });
    await flushPromises();

    expect(wrapper.emitted("toc-change")?.[0]?.[0]).toEqual([
      { id: "setup-guide", text: "Setup Guide", level: 2 },
      { id: "install-vue-3", text: "Install Vue 3", level: 3 },
      { id: "setup-guide-2", text: "Setup Guide", level: 2 }
    ]);
    expect(wrapper.find("#setup-guide").exists()).toBe(true);
    expect(wrapper.find("#setup-guide-2").exists()).toBe(true);
  });

  it("enhances code blocks with language labels and copy buttons", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const wrapper = mount(ArticleRenderer, {
      props: {
        contentHtml: '<pre><code class="language-ts">const answer: number = 42;</code></pre>'
      }
    });
    await flushPromises();

    expect(wrapper.text()).toContain("ts");
    expect(wrapper.get('[data-test="copy-code"]').attributes("aria-label")).toBe("Copy code block");

    await wrapper.get('[data-test="copy-code"]').trigger("click");
    await flushPromises();

    expect(writeText).toHaveBeenCalledWith("const answer: number = 42;");
    expect(wrapper.text()).toContain("Copied");
  });

  it("keeps code visible when no language class is present", async () => {
    const wrapper = mount(ArticleRenderer, {
      props: {
        contentHtml: "<pre><code>plain text</code></pre>"
      }
    });
    await flushPromises();

    expect(wrapper.text()).toContain("plain text");
    expect(wrapper.find('[data-test="copy-code"]').exists()).toBe(true);
  });
});
```

- [ ] **Step 3: Run ArticleRenderer tests and verify they fail**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web test -- src/components/reading/ArticleRenderer.test.ts
```

Expected result: FAIL with an import error because `ArticleRenderer.vue` does not exist.

- [ ] **Step 4: Implement ArticleRenderer**

Create `frontend/apps/web/src/components/reading/ArticleRenderer.vue` with:

```vue
<template>
  <article ref="articleRef" class="prose article-renderer" v-html="contentHtml"></article>
</template>

<script setup lang="ts">
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import { nextTick, onMounted, ref, watch } from "vue";
import { applyHeadingIds, type TocItem } from "../../features/reading/articleEnhancements";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("css", css);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("vue", xml);
hljs.registerLanguage("xml", xml);

const props = defineProps<{
  contentHtml?: string | null;
}>();

const emit = defineEmits<{
  "toc-change": [items: TocItem[]];
}>();

const articleRef = ref<HTMLElement | null>(null);

function languageFromCode(code: HTMLElement) {
  const languageClass = Array.from(code.classList).find((className) => className.startsWith("language-"));
  return languageClass?.replace("language-", "") ?? "";
}

function highlightCode(code: HTMLElement, language: string) {
  const original = code.textContent ?? "";
  if (!original.trim()) {
    return original;
  }

  try {
    if (language && hljs.getLanguage(language)) {
      code.innerHTML = hljs.highlight(original, { language }).value;
    } else {
      code.innerHTML = hljs.highlightAuto(original).value;
    }
  } catch {
    code.textContent = original;
  }

  return original;
}

function createCodeHeader(language: string, codeText: string) {
  const header = document.createElement("div");
  header.className = "code-block-header";

  const label = document.createElement("span");
  label.className = "code-language";
  label.textContent = language || "code";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "copy-code-button";
  button.dataset.test = "copy-code";
  button.setAttribute("aria-label", "Copy code block");
  button.textContent = "Copy";
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard?.writeText(codeText);
      button.textContent = "Copied";
    } catch {
      button.textContent = "Copy failed";
    }
  });

  header.append(label, button);
  return header;
}

function enhanceCodeBlocks(root: HTMLElement) {
  root.querySelectorAll("pre").forEach((pre) => {
    if (pre.parentElement?.classList.contains("code-block-shell")) {
      return;
    }

    const code = pre.querySelector("code");
    if (!(code instanceof HTMLElement)) {
      return;
    }

    const language = languageFromCode(code);
    const codeText = highlightCode(code, language);
    const shell = document.createElement("div");
    shell.className = "code-block-shell";
    shell.appendChild(createCodeHeader(language, codeText));

    pre.replaceWith(shell);
    shell.appendChild(pre);
  });
}

async function enhanceArticle() {
  await nextTick();
  const article = articleRef.value;
  if (!article) {
    emit("toc-change", []);
    return;
  }

  const tocItems = applyHeadingIds(article);
  enhanceCodeBlocks(article);
  emit("toc-change", tocItems);
}

onMounted(enhanceArticle);
watch(() => props.contentHtml, enhanceArticle);
</script>
```

- [ ] **Step 5: Run ArticleRenderer tests and verify they pass**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web test -- src/components/reading/ArticleRenderer.test.ts
```

Expected result: PASS for `ArticleRenderer.test.ts`.

- [ ] **Step 6: Commit ArticleRenderer**

Run:

```powershell
git add frontend/apps/web/package.json frontend/pnpm-lock.yaml frontend/apps/web/src/components/reading/ArticleRenderer.vue frontend/apps/web/src/components/reading/ArticleRenderer.test.ts
git commit -m "Add article renderer enhancements"
```

---

### Task 3: Add Table Of Contents Component

**Files:**
- Create: `frontend/apps/web/src/components/reading/ArticleToc.test.ts`
- Create: `frontend/apps/web/src/components/reading/ArticleToc.vue`

- [ ] **Step 1: Write failing ArticleToc tests**

Create `frontend/apps/web/src/components/reading/ArticleToc.test.ts` with:

```ts
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ArticleToc from "./ArticleToc.vue";

const items = [
  { id: "setup-guide", text: "Setup Guide", level: 2 as const },
  { id: "install-vue-3", text: "Install Vue 3", level: 3 as const }
];

describe("ArticleToc", () => {
  it("renders nested heading entries and active state", () => {
    const wrapper = mount(ArticleToc, {
      props: { items, activeId: "install-vue-3" }
    });

    expect(wrapper.text()).toContain("On this page");
    expect(wrapper.get('a[href="#setup-guide"]').text()).toBe("Setup Guide");
    expect(wrapper.get('a[href="#install-vue-3"]').classes()).toContain("is-active");
    expect(wrapper.get('a[href="#install-vue-3"]').classes()).toContain("toc-level-3");
  });

  it("emits navigate when an entry is clicked", async () => {
    const wrapper = mount(ArticleToc, {
      props: { items, activeId: "" }
    });

    await wrapper.get('a[href="#setup-guide"]').trigger("click");

    expect(wrapper.emitted("navigate")).toEqual([["setup-guide"]]);
  });

  it("does not render when there are no items", () => {
    const wrapper = mount(ArticleToc, {
      props: { items: [], activeId: "" }
    });

    expect(wrapper.find("nav").exists()).toBe(false);
  });
});
```

- [ ] **Step 2: Run ArticleToc tests and verify they fail**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web test -- src/components/reading/ArticleToc.test.ts
```

Expected result: FAIL with an import error because `ArticleToc.vue` does not exist.

- [ ] **Step 3: Implement ArticleToc**

Create `frontend/apps/web/src/components/reading/ArticleToc.vue` with:

```vue
<template>
  <nav v-if="items.length" class="article-toc" aria-label="Article table of contents">
    <h2>On this page</h2>
    <ol>
      <li v-for="item in items" :key="item.id">
        <a
          :href="`#${item.id}`"
          :class="[`toc-level-${item.level}`, { 'is-active': item.id === activeId }]"
          @click.prevent="$emit('navigate', item.id)"
        >
          {{ item.text }}
        </a>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import type { TocItem } from "../../features/reading/articleEnhancements";

defineProps<{
  items: TocItem[];
  activeId: string;
}>();

defineEmits<{
  navigate: [id: string];
}>();
</script>
```

- [ ] **Step 4: Run ArticleToc tests and verify they pass**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web test -- src/components/reading/ArticleToc.test.ts
```

Expected result: PASS for `ArticleToc.test.ts`.

- [ ] **Step 5: Commit ArticleToc**

Run:

```powershell
git add frontend/apps/web/src/components/reading/ArticleToc.vue frontend/apps/web/src/components/reading/ArticleToc.test.ts
git commit -m "Add article table of contents"
```

---

### Task 4: Add Reading Progress And Preferences

**Files:**
- Create: `frontend/apps/web/src/components/reading/ReadingProgress.test.ts`
- Create: `frontend/apps/web/src/components/reading/ReadingProgress.vue`
- Create: `frontend/apps/web/src/components/reading/ReadingPreferences.test.ts`
- Create: `frontend/apps/web/src/components/reading/ReadingPreferences.vue`

- [ ] **Step 1: Write failing ReadingProgress tests**

Create `frontend/apps/web/src/components/reading/ReadingProgress.test.ts` with:

```ts
import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ReadingProgress from "./ReadingProgress.vue";

describe("ReadingProgress", () => {
  it("updates the progress bar width on scroll", async () => {
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 600 });
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 2000 });

    const wrapper = mount(ReadingProgress);
    window.dispatchEvent(new Event("scroll"));
    await flushPromises();

    expect(wrapper.get(".reading-progress-bar").attributes("style")).toContain("width: 50%");
  });
});
```

- [ ] **Step 2: Write failing ReadingPreferences tests**

Create `frontend/apps/web/src/components/reading/ReadingPreferences.test.ts` with:

```ts
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { READING_THEME_KEY } from "../../features/reading/articleEnhancements";
import ReadingPreferences from "./ReadingPreferences.vue";

describe("ReadingPreferences", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("starts from the stored dark theme", () => {
    localStorage.setItem(READING_THEME_KEY, "dark");

    const wrapper = mount(ReadingPreferences);

    expect(wrapper.get("button").text()).toContain("Light mode");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("toggles and stores dark mode", async () => {
    const wrapper = mount(ReadingPreferences);

    expect(document.documentElement.dataset.theme).toBe("light");
    await wrapper.get("button").trigger("click");

    expect(localStorage.getItem(READING_THEME_KEY)).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(wrapper.get("button").text()).toContain("Light mode");
  });
});
```

- [ ] **Step 3: Run reading control tests and verify they fail**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web test -- src/components/reading/ReadingProgress.test.ts src/components/reading/ReadingPreferences.test.ts
```

Expected result: FAIL with import errors because the components do not exist.

- [ ] **Step 4: Implement ReadingProgress**

Create `frontend/apps/web/src/components/reading/ReadingProgress.vue` with:

```vue
<template>
  <div class="reading-progress" aria-hidden="true">
    <div class="reading-progress-bar" :style="{ width: `${progress}%` }"></div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { calculateReadingProgress } from "../../features/reading/articleEnhancements";

const progress = ref(0);

function updateProgress() {
  progress.value = calculateReadingProgress({
    scrollY: window.scrollY,
    viewportHeight: window.innerHeight,
    documentHeight: document.documentElement.scrollHeight
  });
}

onMounted(() => {
  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", updateProgress);
  window.removeEventListener("resize", updateProgress);
});
</script>
```

- [ ] **Step 5: Implement ReadingPreferences**

Create `frontend/apps/web/src/components/reading/ReadingPreferences.vue` with:

```vue
<template>
  <button class="reading-preferences" type="button" @click="toggleTheme">
    {{ theme === "dark" ? "Light mode" : "Dark mode" }}
  </button>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import {
  readStoredTheme,
  writeStoredTheme,
  type ReadingTheme
} from "../../features/reading/articleEnhancements";

const theme = ref<ReadingTheme>("light");

function applyTheme(nextTheme: ReadingTheme) {
  document.documentElement.dataset.theme = nextTheme;
}

function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark";
}

onMounted(() => {
  theme.value = readStoredTheme();
  applyTheme(theme.value);
});

watch(theme, (nextTheme) => {
  applyTheme(nextTheme);
  writeStoredTheme(nextTheme);
});
</script>
```

- [ ] **Step 6: Run reading control tests and verify they pass**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web test -- src/components/reading/ReadingProgress.test.ts src/components/reading/ReadingPreferences.test.ts
```

Expected result: PASS for `ReadingProgress.test.ts` and `ReadingPreferences.test.ts`.

- [ ] **Step 7: Commit reading controls**

Run:

```powershell
git add frontend/apps/web/src/components/reading/ReadingProgress.vue frontend/apps/web/src/components/reading/ReadingProgress.test.ts frontend/apps/web/src/components/reading/ReadingPreferences.vue frontend/apps/web/src/components/reading/ReadingPreferences.test.ts
git commit -m "Add reading progress and theme controls"
```

---

### Task 5: Wire The Article Detail Page

**Files:**
- Create: `frontend/apps/web/src/views/PostDetailView.test.ts`
- Modify: `frontend/apps/web/src/views/PostDetailView.vue`

- [ ] **Step 1: Write failing PostDetailView tests**

Create `frontend/apps/web/src/views/PostDetailView.test.ts` with:

```ts
import { flushPromises, mount } from "@vue/test-utils";
import type { Post } from "@blog/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PostDetailView from "./PostDetailView.vue";

const routeMock = vi.hoisted(() => ({ params: { slug: "reader-upgrade" } }));
const postMock = vi.hoisted(() => vi.fn());

vi.mock("vue-router", async () => {
  const actual = await vi.importActual<typeof import("vue-router")>("vue-router");
  return {
    ...actual,
    useRoute: () => routeMock,
    RouterLink: { props: ["to"], template: "<a :href='to'><slot /></a>" }
  };
});

vi.mock("../lib/api", () => ({
  publicApi: {
    post: postMock
  }
}));

const post: Post = {
  id: 1,
  title: "Reader Upgrade",
  slug: "reader-upgrade",
  summary: "A better long-form reading page.",
  contentHtml: "<h2>Setup Guide</h2><p>Hello reader.</p><pre><code>npm test</code></pre>",
  coverMediaUrl: "/uploads/cover.png",
  status: "PUBLISHED",
  publishedAt: "2026-05-20T00:00:00Z",
  category: { id: 1, name: "Engineering", slug: "engineering" },
  tags: [{ id: 2, name: "Vue", slug: "vue" }]
};

describe("PostDetailView", () => {
  beforeEach(() => {
    routeMock.params = { slug: "reader-upgrade" };
    postMock.mockReset();
    document.documentElement.removeAttribute("data-theme");
    localStorage.clear();
  });

  it("renders article metadata, cover, body, and reading controls", async () => {
    postMock.mockResolvedValue(post);

    const wrapper = mount(PostDetailView, {
      global: {
        stubs: {
          RouterLink: { props: ["to"], template: "<a :href='to'><slot /></a>" }
        }
      }
    });
    await flushPromises();

    expect(postMock).toHaveBeenCalledWith("reader-upgrade");
    expect(wrapper.text()).toContain("Reader Upgrade");
    expect(wrapper.text()).toContain("A better long-form reading page.");
    expect(wrapper.text()).toContain("Engineering");
    expect(wrapper.text()).toContain("#Vue");
    expect(wrapper.get(".article-hero-cover").attributes("src")).toBe("/uploads/cover.png");
    expect(wrapper.text()).toContain("Setup Guide");
    expect(wrapper.text()).toContain("On this page");
    expect(wrapper.find(".reading-progress").exists()).toBe(true);
    expect(wrapper.find(".reading-preferences").exists()).toBe(true);
    expect(wrapper.find('[data-test="back-to-top"]').exists()).toBe(true);
  });

  it("shows a clear error state when the article cannot load", async () => {
    postMock.mockRejectedValue(new Error("not found"));

    const wrapper = mount(PostDetailView);
    await flushPromises();

    expect(wrapper.text()).toContain("Article unavailable");
    expect(wrapper.text()).toContain("Return to archive");
  });
});
```

- [ ] **Step 2: Run PostDetailView tests and verify they fail**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web test -- src/views/PostDetailView.test.ts
```

Expected result: FAIL because the route still renders only the old simple article markup.

- [ ] **Step 3: Implement the wired article detail page**

Replace `frontend/apps/web/src/views/PostDetailView.vue` with:

```vue
<template>
  <ReadingProgress />

  <main v-if="post" class="article-page">
    <header class="article-hero">
      <p class="kicker">{{ formatDate(post.publishedAt) }}</p>
      <div class="article-taxonomy">
        <RouterLink v-if="post.category" :to="`/categories/${post.category.slug}`">{{ post.category.name }}</RouterLink>
        <span v-for="tag in post.tags ?? []" :key="tag.id">#{{ tag.name }}</span>
      </div>
      <h1>{{ post.title }}</h1>
      <p v-if="post.summary" class="summary">{{ post.summary }}</p>
      <img v-if="post.coverMediaUrl" class="article-hero-cover" :src="post.coverMediaUrl" :alt="post.title" />
    </header>

    <div class="article-layout">
      <ArticleRenderer class="article-content" :content-html="post.contentHtml" @toc-change="tocItems = $event" />
      <aside class="article-sidebar">
        <ReadingPreferences />
        <ArticleToc :items="tocItems" :active-id="activeHeadingId" @navigate="navigateToHeading" />
      </aside>
    </div>

    <button data-test="back-to-top" class="back-to-top" type="button" @click="scrollToTop">Back to top</button>
  </main>

  <main v-else-if="loadFailed" class="content-band article-error">
    <h1>Article unavailable</h1>
    <p>The article could not be loaded. It may have moved or is not published.</p>
    <RouterLink to="/archive">Return to archive</RouterLink>
  </main>
</template>

<script setup lang="ts">
import { formatDate, type Post } from "@blog/shared";
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import ArticleRenderer from "../components/reading/ArticleRenderer.vue";
import ArticleToc from "../components/reading/ArticleToc.vue";
import ReadingPreferences from "../components/reading/ReadingPreferences.vue";
import ReadingProgress from "../components/reading/ReadingProgress.vue";
import type { TocItem } from "../features/reading/articleEnhancements";
import { publicApi } from "../lib/api";

const route = useRoute();
const post = ref<Post | null>(null);
const loadFailed = ref(false);
const tocItems = ref<TocItem[]>([]);
const activeHeadingId = ref("");

function navigateToHeading(id: string) {
  const target = document.getElementById(id);
  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });
  activeHeadingId.value = id;
}

function updateActiveHeading() {
  let activeId = "";
  for (const item of tocItems.value) {
    const heading = document.getElementById(item.id);
    if (heading && heading.getBoundingClientRect().top <= 120) {
      activeId = item.id;
    }
  }
  activeHeadingId.value = activeId || tocItems.value[0]?.id || "";
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

onMounted(async () => {
  try {
    post.value = await publicApi.post(String(route.params.slug));
    await nextTick();
    updateActiveHeading();
  } catch {
    loadFailed.value = true;
    post.value = null;
  }

  window.addEventListener("scroll", updateActiveHeading, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", updateActiveHeading);
});
</script>
```

- [ ] **Step 4: Run PostDetailView tests and verify they pass**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web test -- src/views/PostDetailView.test.ts
```

Expected result: PASS for `PostDetailView.test.ts`.

- [ ] **Step 5: Commit article detail wiring**

Run:

```powershell
git add frontend/apps/web/src/views/PostDetailView.vue frontend/apps/web/src/views/PostDetailView.test.ts
git commit -m "Wire article reading page"
```

---

### Task 6: Add Prose, Layout, And Dark Theme Styles

**Files:**
- Modify: `frontend/apps/web/src/styles.css`

- [ ] **Step 1: Add article reading styles**

Append this CSS to `frontend/apps/web/src/styles.css`, after the current `.prose img` block and before `.archive-month`:

```css
:root[data-theme="dark"] {
  --paper: #151512;
  --ink: #f3efe5;
  --red: #f05d4f;
  --blue: #7fb1ff;
  --yellow: #f5d769;
}

.article-page {
  width: min(1220px, calc(100% - 32px));
  margin: 0 auto;
  padding: 44px 0 72px;
}

.article-hero {
  border-bottom: var(--line);
  display: grid;
  gap: 18px;
  padding-bottom: 28px;
}

.article-hero h1 {
  font-family: "Archivo Black", "Arial Black", sans-serif;
  font-size: clamp(42px, 9vw, 108px);
  line-height: 0.9;
  margin: 0;
  overflow-wrap: anywhere;
}

.article-taxonomy {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.article-taxonomy a,
.article-taxonomy span {
  border: 2px solid var(--ink);
  font-family: "IBM Plex Mono", monospace;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.2;
  padding: 6px 8px;
}

.article-taxonomy a {
  background: var(--red);
  color: var(--paper);
}

.article-taxonomy span {
  background: var(--yellow);
  color: #11100d;
}

.article-hero-cover {
  border: var(--line);
  display: block;
  max-height: 520px;
  object-fit: cover;
  width: 100%;
}

.article-layout {
  align-items: start;
  display: grid;
  gap: 28px;
  grid-template-columns: minmax(0, 1fr) 280px;
  padding-top: 28px;
}

.article-content {
  min-width: 0;
}

.article-sidebar {
  display: grid;
  gap: 14px;
  position: sticky;
  top: 20px;
}

.prose {
  max-width: 760px;
}

.prose h2,
.prose h3,
.prose h4 {
  font-family: "Archivo Black", "Arial Black", sans-serif;
  line-height: 1.05;
  margin: 2.2em 0 0.6em;
  scroll-margin-top: 96px;
}

.prose h2 {
  font-size: clamp(30px, 5vw, 54px);
}

.prose h3 {
  font-size: clamp(24px, 4vw, 36px);
}

.prose h4 {
  font-size: 22px;
}

.prose p,
.prose li {
  overflow-wrap: anywhere;
}

.prose a {
  border-bottom: 2px solid var(--blue);
  color: var(--blue);
  font-weight: 800;
}

.prose blockquote {
  border-left: 12px solid var(--yellow);
  font-size: 20px;
  font-weight: 800;
  margin: 24px 0;
  padding: 4px 0 4px 18px;
}

.prose ul,
.prose ol {
  padding-left: 1.4em;
}

.prose table {
  border-collapse: collapse;
  display: block;
  max-width: 100%;
  overflow-x: auto;
  white-space: nowrap;
}

.prose th,
.prose td {
  border: 2px solid var(--ink);
  padding: 8px 10px;
}

.prose code {
  background: rgba(29, 88, 168, 0.13);
  border: 1px solid currentColor;
  font-family: "IBM Plex Mono", "Consolas", monospace;
  font-size: 0.9em;
  padding: 0.12em 0.3em;
}

.code-block-shell {
  border: var(--line);
  margin: 24px 0;
  max-width: 100%;
  overflow: hidden;
}

.code-block-header {
  align-items: center;
  background: var(--yellow);
  border-bottom: var(--line);
  color: #11100d;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding: 8px 10px;
}

.code-language {
  font-family: "IBM Plex Mono", "Consolas", monospace;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.copy-code-button,
.reading-preferences,
.back-to-top {
  background: var(--paper);
  border: 2px solid var(--ink);
  color: var(--ink);
  cursor: pointer;
  font: inherit;
  font-weight: 900;
  min-height: 36px;
  padding: 6px 10px;
}

.code-block-shell pre {
  background: #11100d;
  color: #f4f0e8;
  margin: 0;
  overflow-x: auto;
  padding: 16px;
}

.code-block-shell code {
  background: transparent;
  border: 0;
  color: inherit;
  display: block;
  padding: 0;
}

.hljs-keyword,
.hljs-selector-tag,
.hljs-literal {
  color: #f5d769;
}

.hljs-string,
.hljs-title,
.hljs-name {
  color: #8fd694;
}

.hljs-number,
.hljs-attr,
.hljs-built_in {
  color: #7fb1ff;
}

.hljs-comment {
  color: #b8b2a7;
}

.article-toc {
  border: var(--line);
  background: var(--paper);
  padding: 14px;
}

.article-toc h2 {
  font-family: "Archivo Black", "Arial Black", sans-serif;
  font-size: 20px;
  line-height: 1;
  margin: 0 0 12px;
}

.article-toc ol {
  display: grid;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.article-toc a {
  border-left: 4px solid transparent;
  display: block;
  font-weight: 800;
  line-height: 1.25;
  padding: 4px 0 4px 8px;
}

.article-toc .toc-level-3 {
  font-size: 14px;
  margin-left: 12px;
}

.article-toc .is-active {
  border-left-color: var(--red);
  color: var(--red);
}

.reading-progress {
  height: 6px;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 20;
}

.reading-progress-bar {
  background: var(--red);
  height: 100%;
  transition: width 120ms ease-out;
}

.back-to-top {
  bottom: 18px;
  position: fixed;
  right: 18px;
  z-index: 10;
}

.article-error {
  display: grid;
  gap: 14px;
}

.article-error h1 {
  font-family: "Archivo Black", "Arial Black", sans-serif;
  font-size: clamp(40px, 8vw, 88px);
  line-height: 0.95;
  margin: 0;
}

.article-error a {
  border: 2px solid var(--ink);
  font-weight: 900;
  justify-self: start;
  padding: 10px 12px;
}
```

- [ ] **Step 2: Add mobile reading layout styles**

Append this block inside the existing `@media (max-width: 760px)` rule in `frontend/apps/web/src/styles.css`:

```css
  .article-page {
    width: min(100% - 24px, 1220px);
    padding-top: 28px;
  }

  .article-layout {
    grid-template-columns: 1fr;
  }

  .article-sidebar {
    order: -1;
    position: static;
  }

  .article-toc {
    max-height: 260px;
    overflow-y: auto;
  }

  .summary {
    font-size: 19px;
  }

  .prose {
    font-size: 17px;
    max-width: none;
  }

  .back-to-top {
    bottom: 12px;
    right: 12px;
  }
```

- [ ] **Step 3: Run web tests**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web test
```

Expected result: PASS for all web tests.

- [ ] **Step 4: Run web build**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web build
```

Expected result: PASS for `vue-tsc --noEmit` and Vite build.

- [ ] **Step 5: Commit reading styles**

Run:

```powershell
git add frontend/apps/web/src/styles.css
git commit -m "Style article reading experience"
```

---

### Task 7: Full Verification And Browser Check

**Files:**
- Modify only files already touched if verification exposes layout or behavior defects.

- [ ] **Step 1: Run helper and component test subset**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web test -- src/features/reading/articleEnhancements.test.ts src/components/reading/ArticleRenderer.test.ts src/components/reading/ArticleToc.test.ts src/components/reading/ReadingProgress.test.ts src/components/reading/ReadingPreferences.test.ts src/views/PostDetailView.test.ts
```

Expected result: PASS for the reading-experience test files.

- [ ] **Step 2: Run the complete public web test suite**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web test
```

Expected result: PASS for all `@blog/web` tests.

- [ ] **Step 3: Run the public web build**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web build
```

Expected result: PASS for `vue-tsc --noEmit` and Vite build.

- [ ] **Step 4: Start the public web dev server**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web dev
```

Expected result: Vite serves the public app at `http://127.0.0.1:5174/`.

- [ ] **Step 5: Browser-check a desktop article page**

Open an article detail URL in the in-app browser, such as:

```text
http://127.0.0.1:5174/posts/<published-post-slug>
```

Verify:

- Article header renders date, taxonomy, title, summary, and cover without overlap.
- Body width remains comfortable on desktop.
- TOC appears in the right column when the article has `h2` or `h3` headings.
- Reading progress updates while scrolling.
- Code blocks show a language label and copy button.
- Dark mode changes text, background, links, code blocks, and borders with readable contrast.
- Back-to-top scrolls the viewport upward.

- [ ] **Step 6: Browser-check mobile layout**

Use a narrow viewport around `390px` width and verify:

- Article body remains single-column.
- Sidebar content stacks without squeezing the prose.
- Code blocks and tables scroll horizontally instead of widening the page.
- Copy buttons, theme button, TOC links, and back-to-top fit within the viewport.
- No text overlaps controls.

- [ ] **Step 7: Fix verification defects with the smallest scoped change**

If tests or build fail, fix the exact failing file and re-run the failed command. If browser verification shows layout overlap, change only `frontend/apps/web/src/styles.css` unless behavior is wrong.

Acceptable focused CSS fixes include:

```css
.article-sidebar {
  min-width: 0;
}

.code-block-header {
  flex-wrap: wrap;
}

.back-to-top {
  max-width: calc(100vw - 24px);
}
```

- [ ] **Step 8: Re-run final verification after fixes**

Run:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web test
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend --filter @blog/web build
```

Expected result: both commands pass.

- [ ] **Step 9: Commit final verification fixes**

If Step 7 changed files, run:

```powershell
git add frontend/apps/web/src
git commit -m "Polish article reading verification"
```

If Step 7 did not change files, skip this commit.

---

## Plan Self-Review

- Spec coverage: prose layout, article header, TOC, heading anchors, code highlighting, copy buttons, reading progress, back-to-top, dark mode, mobile behavior, error handling, and public web verification are covered by Tasks 1-7.
- Scope check: no backend schema, admin editor, search, RSS, recommendations, comments, or SEO work is included.
- Missing-detail scan: the plan contains concrete file paths, test code, implementation code, commands, and expected results for each implementation task.
- Type consistency: `TocItem`, `ReadingTheme`, `READING_THEME_KEY`, `applyHeadingIds`, and `calculateReadingProgress` are defined in Task 1 before use in later tasks.
