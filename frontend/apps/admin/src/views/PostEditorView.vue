<template>
  <section class="panel post-editor-panel">
    <div class="page-head editor-head">
      <div>
        <h1>{{ isNew ? "新建文章" : "编辑文章" }}</h1>
        <p class="editor-status" :class="`editor-status--${saveState}`">{{ editorStatusText }}</p>
      </div>
      <div class="editor-actions">
        <el-button @click="goBack">返回</el-button>
        <el-button data-test="save-draft" :loading="saveState === 'saving'" @click="save('DRAFT')">保存草稿</el-button>
        <el-button data-test="publish-post" type="danger" :loading="saveState === 'saving'" @click="save('PUBLISHED')">发布文章</el-button>
      </div>
    </div>

    <el-alert v-if="errors.length" type="error" :title="errors.join(', ')" :closable="false" />
    <el-alert v-if="saveError" type="error" :title="saveError" :closable="false" />
    <el-alert v-if="publishCheckError" type="error" :title="publishCheckError" :closable="false" />

    <el-form label-position="top" class="editor-form">
      <div class="writing-workbench">
        <div class="writing-main">
          <el-form-item label="标题">
            <el-input v-model="form.title" aria-label="标题" @blur="syncSlug" />
          </el-form-item>

          <div class="mode-actions">
            <el-button data-test="edit-mode" :type="activeMode === 'edit' ? 'primary' : 'default'" @click="activeMode = 'edit'">编辑</el-button>
            <el-button data-test="preview-mode" :type="activeMode === 'preview' ? 'primary' : 'default'" @click="activeMode = 'preview'">预览</el-button>
          </div>

          <template v-if="activeMode === 'edit'">
            <div class="toolbar" aria-label="文章编辑工具栏">
              <el-button aria-label="加粗" @click="editor?.chain().focus().toggleBold().run()">B</el-button>
              <el-button aria-label="斜体" @click="editor?.chain().focus().toggleItalic().run()">I</el-button>
              <el-button aria-label="二级标题" @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()">H2</el-button>
              <el-button aria-label="三级标题" @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()">H3</el-button>
              <el-button aria-label="项目列表" @click="editor?.chain().focus().toggleBulletList().run()">列表</el-button>
              <el-button aria-label="引用" @click="editor?.chain().focus().toggleBlockquote().run()">引用</el-button>
              <el-button aria-label="插入链接" @click="openLinkDialog">链接</el-button>
              <el-button aria-label="插入图片" @click="openImageDialog">图片</el-button>
              <el-button aria-label="代码块" @click="editor?.chain().focus().toggleCodeBlock().run()">代码</el-button>
              <el-button aria-label="撤销" @click="editor?.chain().focus().undo().run()">撤销</el-button>
              <el-button aria-label="重做" @click="editor?.chain().focus().redo().run()">重做</el-button>
            </div>

            <EditorContent v-if="editor" class="editor-surface" :editor="editor" />
          </template>

          <article v-else class="editor-preview article-page" data-test="site-preview">
            <header class="article-hero">
              <p class="kicker">{{ previewDateText }}</p>
              <div class="article-taxonomy">
                <span v-if="selectedCategory">{{ selectedCategory.name }}</span>
                <span v-for="tag in selectedTags" :key="tag.id">#{{ tag.name }}</span>
              </div>
              <h1>{{ form.title || "未命名文章" }}</h1>
              <p v-if="form.summary" class="summary">{{ form.summary }}</p>
              <img v-if="selectedCover" class="article-hero-cover" :src="selectedCover.url" :alt="selectedCover.originalName" />
            </header>

            <div class="article-layout">
              <article ref="previewArticleRef" class="prose article-renderer article-content" v-html="form.contentHtml"></article>
              <aside class="article-sidebar">
                <nav class="article-toc" aria-label="文章目录">
                  <h2>目录</h2>
                  <ol v-if="previewTocItems.length">
                    <li v-for="item in previewTocItems" :key="item.id" :class="`toc-level-${item.level}`">
                      <a :href="`#${item.id}`" @click.prevent="scrollPreviewHeading(item.id)">{{ item.text }}</a>
                    </li>
                  </ol>
                  <p v-else>暂无目录</p>
                </nav>
              </aside>
            </div>
          </article>
        </div>

        <PostPublishPanel
          :form="form"
          :checks="publishChecks"
          :categories="categories"
          :topics="topics"
          :series="series"
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

    <el-dialog v-model="linkDialogOpen" title="插入链接" width="420px" :append-to-body="false" class="reference-dialog">
      <el-form label-position="top" class="reference-form">
        <el-form-item label="链接文字">
          <el-input v-model="linkForm.text" data-test="link-text" aria-label="链接文字" placeholder="选中文字时可留空" />
        </el-form-item>
        <el-form-item label="链接 URL">
          <el-input v-model="linkForm.href" data-test="link-href" aria-label="链接 URL" placeholder="https://example.com" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="linkDialogOpen = false">取消</el-button>
        <el-button data-test="confirm-link" type="primary" @click="confirmLink">插入链接</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="imageDialogOpen" title="插入图片" width="560px" :append-to-body="false" class="reference-dialog">
      <el-form label-position="top" class="reference-form">
        <el-form-item label="媒体库图片">
          <div class="image-asset-grid">
            <button
              v-for="asset in imageAssets"
              :key="asset.id"
              class="image-asset"
              :class="{ 'is-selected': imageForm.mediaAssetId === asset.id }"
              :data-test="`image-asset-${asset.id}`"
              type="button"
              @click="selectImageAsset(asset)"
            >
              <img :src="asset.url" :alt="asset.originalName" />
              <span>{{ asset.originalName }}</span>
            </button>
            <p v-if="!imageAssets.length" class="empty-reference">媒体库暂无可用图片</p>
          </div>
        </el-form-item>
        <el-form-item label="图片 URL">
          <el-input v-model="imageForm.src" data-test="image-src" aria-label="图片 URL" placeholder="/uploads/image.png 或 https://..." />
        </el-form-item>
        <el-form-item label="替代文字">
          <el-input v-model="imageForm.alt" data-test="image-alt" aria-label="替代文字" placeholder="图片描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="imageDialogOpen = false">取消</el-button>
        <el-button data-test="confirm-image" type="primary" @click="confirmImage">插入图片</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { formatDate, slugify, type Category, type MediaAsset, type Post, type Series, type Tag, type Topic } from "@blog/shared";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
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
import { adminApi } from "../lib/api";
import PostPublishPanel from "./PostPublishPanel.vue";

type SaveState = "idle" | "saving" | "saved" | "error";
type EditorMode = "edit" | "preview";
interface PreviewTocItem {
  id: string;
  text: string;
  level: 2 | 3;
}
let isInternalRouteReplace = false;
let isUnmounted = false;

const route = useRoute();
const router = useRouter();
const createdPostId = ref<number | null>(null);
const routePostId = computed(() => (route.params.id === undefined ? null : Number(route.params.id)));
const currentPostId = computed(() => routePostId.value ?? createdPostId.value);
const isNew = computed(() => currentPostId.value === null);
const categories = ref<Category[]>([]);
const tags = ref<Tag[]>([]);
const topics = ref<Topic[]>([]);
const series = ref<Series[]>([]);
const mediaAssets = ref<MediaAsset[]>([]);
const errors = ref<string[]>([]);
const saveError = ref("");
const publishCheckError = ref("");
const saveState = ref<SaveState>("idle");
const activeMode = ref<EditorMode>("edit");
const lastSavedAt = ref("");
const serverSnapshotUpdatedAt = ref(0);
const linkDialogOpen = ref(false);
const imageDialogOpen = ref(false);
const previewArticleRef = ref<HTMLElement | null>(null);
const previewTocItems = ref<PreviewTocItem[]>([]);
const form = reactive<PostForm>({
  title: "",
  slug: "",
  summary: "",
  contentHtml: "",
  coverMediaId: null,
  status: "DRAFT",
  categoryId: null,
  topicIds: [],
  seriesId: null,
  seriesOrder: null,
  tagIds: []
});
const linkForm = reactive({
  text: "",
  href: ""
});
const imageForm = reactive<{
  mediaAssetId: number | null;
  src: string;
  alt: string;
}>({
  mediaAssetId: null,
  src: "",
  alt: ""
});
const lastSavedSnapshot = ref(postFormSnapshot(form));
const recoverySnapshot = ref<PostRecoverySnapshot | null>(null);
const recoveryWritesReady = ref(false);

const editor = useEditor({
  extensions: [StarterKit, Link.configure({ openOnClick: false }), Image],
  content: form.contentHtml,
  onUpdate({ editor: current }) {
    form.contentHtml = current.getHTML();
    if (saveState.value === "saved") {
      saveState.value = "idle";
    }
  }
});

const isDirty = computed(() => postFormSnapshot(form) !== lastSavedSnapshot.value);
const wordCount = computed(() => wordCountFromHtml(form.contentHtml));
const selectedCover = computed(() => mediaAssets.value.find((asset) => asset.id === form.coverMediaId) ?? null);
const selectedCategory = computed(() => categories.value.find((category) => category.id === form.categoryId) ?? null);
const selectedTags = computed(() => tags.value.filter((tag) => form.tagIds.includes(tag.id)));
const imageAssets = computed(() => mediaAssets.value.filter((asset) => asset.mimeType.startsWith("image/")));
const publishChecks = computed(() => publishChecklist(form));
const recoveryKey = computed(() => postRecoveryKey(currentPostId.value === null ? null : currentPostId.value.toString()));
const previewDateText = computed(() => formatDate(form.publishedAt) || "草稿预览");
const hasBlockingPublishChecks = computed(() =>
  publishChecks.value.some((check) => check.level === "required" && !check.passed)
);
const editorStatusText = computed(() => {
  const status = form.status === "PUBLISHED" ? "已发布" : "草稿";
  if (saveState.value === "saving") {
    return `保存中 · ${wordCount.value} 字 · ${status}`;
  }
  if (saveState.value === "error") {
    return `保存失败 · ${wordCount.value} 字 · ${status}`;
  }
  if (saveState.value === "saved") {
    return `已保存${lastSavedAt.value ? ` ${lastSavedAt.value}` : ""} · ${wordCount.value} 字 · ${status}`;
  }
  return `未保存 · ${wordCount.value} 字 · ${status}`;
});

watch(
  () => postFormSnapshot(form),
  (snapshot) => {
    if (snapshot !== lastSavedSnapshot.value) {
      if (publishCheckError.value) {
        publishCheckError.value = "";
      }
      if (saveState.value === "saved" || (saveState.value === "error" && !saveError.value)) {
        saveState.value = "idle";
      }
    }
    if (recoveryWritesReady.value) {
      writeRecoverySnapshot();
    }
  }
);

watch([activeMode, () => form.contentHtml], () => {
  enhancePreviewArticle();
});

function syncSlug() {
  if (!form.slug && form.title) {
    form.slug = slugify(form.title);
  }
}

function updateForm(nextForm: PostForm) {
  const nextContentHtml = nextForm.contentHtml ?? "";
  const shouldSyncEditorContent = nextContentHtml !== (form.contentHtml ?? "");
  assignFormSnapshot(nextForm);
  if (shouldSyncEditorContent) {
    editor.value?.commands.setContent(form.contentHtml ?? "");
  }
}

function applyFormSnapshot(nextForm: PostForm) {
  assignFormSnapshot(nextForm);
  editor.value?.commands.setContent(form.contentHtml ?? "");
}

function assignFormSnapshot(nextForm: PostForm) {
  Object.assign(form, {
    title: nextForm.title ?? "",
    slug: nextForm.slug ?? "",
    summary: nextForm.summary ?? "",
    contentHtml: nextForm.contentHtml ?? "",
    coverMediaId: nextForm.coverMediaId ?? null,
    status: nextForm.status ?? "DRAFT",
    categoryId: nextForm.categoryId ?? null,
    topicIds: nextForm.topicIds ?? [],
    seriesId: nextForm.seriesId ?? null,
    seriesOrder: nextForm.seriesOrder ?? null,
    tagIds: nextForm.tagIds ?? [],
    publishedAt: nextForm.publishedAt ?? null
  });
}

function loadRecoverySnapshot() {
  const stored = window.localStorage.getItem(recoveryKey.value);
  if (!stored) {
    recoverySnapshot.value = null;
    return;
  }

  try {
    const parsed = JSON.parse(stored) as PostRecoverySnapshot;
    if (!parsed || typeof parsed.updatedAt !== "number" || !parsed.form) {
      window.localStorage.removeItem(recoveryKey.value);
      recoverySnapshot.value = null;
      return;
    }
    if (
      postFormSnapshot(parsed.form) === lastSavedSnapshot.value ||
      (serverSnapshotUpdatedAt.value > 0 && parsed.updatedAt <= serverSnapshotUpdatedAt.value)
    ) {
      window.localStorage.removeItem(recoveryKey.value);
      recoverySnapshot.value = null;
      return;
    }
    recoverySnapshot.value = parsed;
  } catch {
    window.localStorage.removeItem(recoveryKey.value);
    recoverySnapshot.value = null;
  }
}

function writeRecoverySnapshot() {
  window.localStorage.setItem(recoveryKey.value, JSON.stringify(postRecoverySnapshot(form)));
}

function clearRecoverySnapshot(key = recoveryKey.value) {
  window.localStorage.removeItem(key);
  recoverySnapshot.value = null;
}

function restoreRecovery() {
  if (!recoverySnapshot.value) {
    return;
  }
  applyFormSnapshot(recoverySnapshot.value.form);
  recoverySnapshot.value = null;
}

function discardRecovery() {
  clearRecoverySnapshot();
}

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "操作失败，请稍后重试";
}

function refreshSavedSnapshot(snapshot = postFormSnapshot(form)) {
  lastSavedSnapshot.value = snapshot;
  lastSavedAt.value = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());
}

async function save(status?: Post["status"]) {
  saveError.value = "";
  publishCheckError.value = "";
  errors.value = [];
  if (status === "PUBLISHED" && hasBlockingPublishChecks.value) {
    publishCheckError.value = "请先完成必填发布检查";
    saveState.value = "error";
    return;
  }
  if (status) {
    form.status = status;
  }
  errors.value = validatePostForm(form);
  if (errors.value.length) {
    return;
  }

  saveState.value = "saving";
  const wasNew = isNew.value;
  const recoveryKeyBeforeSave = recoveryKey.value;
  const submittedForm: PostForm = {
    ...form,
    topicIds: [...form.topicIds],
    tagIds: [...form.tagIds],
    status: form.status ?? "DRAFT"
  };
  const submittedSnapshot = postFormSnapshot(submittedForm);
  try {
    const input = toPostInput(submittedForm);
    const saved = wasNew
      ? await adminApi.createPost(input)
      : await adminApi.updatePost(Number(currentPostId.value), input);
    if (isUnmounted) {
      return;
    }
    if (wasNew && saved.id) {
      await replaceCreatedDraftRoute(saved.id);
      if (isUnmounted) {
        return;
      }
    }
    if (recoveryKeyBeforeSave !== recoveryKey.value) {
      window.localStorage.removeItem(recoveryKeyBeforeSave);
    }
    refreshSavedSnapshot(submittedSnapshot);
    if (postFormSnapshot(form) !== submittedSnapshot) {
      saveState.value = "idle";
      writeRecoverySnapshot();
      return;
    }
    saveState.value = "saved";
    clearRecoverySnapshot();
  } catch (err) {
    saveState.value = "error";
    saveError.value = errorMessage(err);
  }
}

function goBack() {
  router.push("/posts");
}

async function replaceCreatedDraftRoute(postId: number) {
  createdPostId.value = postId;
  isInternalRouteReplace = true;
  try {
    await router.replace(`/posts/${postId}`);
  } finally {
    isInternalRouteReplace = false;
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function selectedEditorText() {
  const current = editor.value;
  const selection = current?.state.selection;
  if (!current || !selection || selection.empty) {
    return "";
  }
  return current.state.doc.textBetween(selection.from, selection.to, " ").trim();
}

function hasEditorSelection() {
  return editor.value?.state.selection.empty === false;
}

function openLinkDialog() {
  const attributes = editor.value?.getAttributes("link") as { href?: unknown } | undefined;
  linkForm.text = selectedEditorText();
  linkForm.href = typeof attributes?.href === "string" ? attributes.href : "";
  linkDialogOpen.value = true;
}

function confirmLink() {
  const href = linkForm.href.trim();
  if (!href || !editor.value) {
    return;
  }

  if (!hasEditorSelection()) {
    const text = linkForm.text.trim() || href;
    editor.value.chain().focus().insertContent(`<a href="${escapeHtml(href)}">${escapeHtml(text)}</a>`).run();
  } else {
    editor.value.chain().focus().extendMarkRange("link").setLink({ href }).run();
  }
  linkDialogOpen.value = false;
}

function openImageDialog() {
  imageForm.mediaAssetId = null;
  imageForm.src = "";
  imageForm.alt = "";
  imageDialogOpen.value = true;
}

function selectImageAsset(asset: MediaAsset) {
  imageForm.mediaAssetId = asset.id;
  imageForm.src = asset.url;
  imageForm.alt = asset.originalName;
}

function confirmImage() {
  const src = imageForm.src.trim();
  if (!src) {
    return;
  }
  const alt = imageForm.alt.trim();
  editor.value?.chain().focus().setImage({ src, alt }).run();
  imageDialogOpen.value = false;
}

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

function uniqueHeadingId(base: string, counts: Map<string, number>) {
  const next = (counts.get(base) ?? 0) + 1;
  counts.set(base, next);
  return next === 1 ? base : `${base}-${next}`;
}

function applyPreviewHeadingIds(root: ParentNode) {
  const counts = new Map<string, number>();
  return Array.from(root.querySelectorAll("h2, h3")).map((heading) => {
    const text = normalizeHeadingText(heading.textContent);
    const id = uniqueHeadingId(slugifyHeading(text), counts);
    const level = heading.tagName.toLowerCase() === "h3" ? 3 : 2;
    if (heading instanceof HTMLElement) {
      heading.id = id;
      heading.tabIndex = -1;
    }
    return { id, text, level } as PreviewTocItem;
  });
}

function languageFromCode(code: HTMLElement) {
  const languageClass = Array.from(code.classList).find((className) => className.startsWith("language-"));
  return languageClass?.replace("language-", "") || "code";
}

function enhancePreviewCodeBlocks(root: HTMLElement) {
  root.querySelectorAll("pre").forEach((pre) => {
    if (pre.parentElement?.classList.contains("code-block-shell")) {
      return;
    }
    const code = pre.querySelector("code");
    if (!(code instanceof HTMLElement)) {
      return;
    }

    const shell = document.createElement("div");
    shell.className = "code-block-shell";

    const header = document.createElement("div");
    header.className = "code-block-header";

    const label = document.createElement("span");
    label.className = "code-language";
    label.textContent = languageFromCode(code);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy-code-button";
    button.textContent = "复制";
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard?.writeText(code.textContent ?? "");
        button.textContent = "已复制";
      } catch {
        button.textContent = "复制失败";
      }
    });

    header.append(label, button);
    shell.appendChild(header);
    pre.replaceWith(shell);
    shell.appendChild(pre);
  });
}

async function enhancePreviewArticle() {
  await nextTick();
  if (activeMode.value !== "preview") {
    previewTocItems.value = [];
    return;
  }
  const article = previewArticleRef.value;
  if (!article) {
    previewTocItems.value = [];
    return;
  }
  previewTocItems.value = applyPreviewHeadingIds(article);
  enhancePreviewCodeBlocks(article);
}

function scrollPreviewHeading(id: string) {
  const target = previewArticleRef.value?.querySelector(`#${CSS.escape(id)}`);
  if (target instanceof HTMLElement) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function confirmLeave() {
  if (isInternalRouteReplace) {
    return true;
  }
  if (!isDirty.value) {
    return true;
  }
  return window.confirm("文章有未保存修改，确定离开吗？");
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!isDirty.value) {
    return;
  }
  event.preventDefault();
  event.returnValue = "";
}

onBeforeRouteLeave(() => confirmLeave());

onMounted(async () => {
  window.addEventListener("beforeunload", handleBeforeUnload);
  const [loadedCategories, loadedTags, loadedTopics, loadedSeries] = await Promise.all([
    adminApi.categories(),
    adminApi.tags(),
    adminApi.topics(),
    adminApi.series()
  ]);
  categories.value = loadedCategories;
  tags.value = loadedTags;
  topics.value = loadedTopics;
  series.value = loadedSeries;

  try {
    mediaAssets.value = (await adminApi.media()).content;
  } catch {
    mediaAssets.value = [];
  }

  if (!isNew.value) {
    const current = (await adminApi.posts()).find((post: Post) => post.id === Number(route.params.id));
    if (current) {
      applyFormSnapshot({
        title: current.title,
        slug: current.slug,
        summary: current.summary ?? "",
        contentHtml: current.contentHtml ?? "",
        coverMediaId: current.coverMediaId ?? null,
        status: current.status,
        categoryId: current.category?.id ?? null,
        topicIds: current.topics?.map((topic) => topic.id) ?? [],
        seriesId: current.series?.id ?? null,
        seriesOrder: current.seriesOrder ?? null,
        tagIds: current.tags?.map((tag) => tag.id) ?? [],
        publishedAt: current.publishedAt ?? null
      });
      serverSnapshotUpdatedAt.value = current.updatedAt ? Date.parse(current.updatedAt) : 0;
    }
  }
  refreshSavedSnapshot();
  saveState.value = "idle";
  loadRecoverySnapshot();
  await nextTick();
  recoveryWritesReady.value = true;
});

onBeforeUnmount(() => {
  isUnmounted = true;
  window.removeEventListener("beforeunload", handleBeforeUnload);
  editor.value?.destroy();
});
</script>

<style scoped>
.post-editor-panel {
  display: grid;
  gap: 16px;
}

.editor-head {
  align-items: flex-start;
  margin-bottom: 0;
}

.editor-actions,
.mode-actions,
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.editor-status {
  margin: 8px 0 0;
  font-weight: 800;
}

.editor-status--error {
  color: var(--red);
}

.editor-form {
  display: grid;
  gap: 14px;
}

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

.toolbar {
  background: var(--paper-soft);
  border: 2px solid var(--ink);
  padding: 8px;
}

.toolbar .el-button {
  margin-left: 0;
}

.editor-surface {
  display: grid;
  padding: 0;
}

.editor-surface :deep(.ProseMirror) {
  min-height: 100%;
  outline: none;
  padding: 14px;
}

.editor-surface :deep(.ProseMirror img) {
  border: var(--line);
  display: block;
  height: auto;
  margin: 16px 0;
  max-width: min(100%, 760px);
}

.mode-actions {
  justify-content: flex-end;
}

.editor-preview.article-page {
  background:
    linear-gradient(90deg, rgba(17, 16, 13, 0.06) 1px, transparent 1px),
    linear-gradient(rgba(17, 16, 13, 0.05) 1px, transparent 1px),
    var(--paper);
  background-size: 48px 48px;
  border: 2px solid var(--ink);
  container-type: inline-size;
  display: block;
  margin: 0;
  overflow: hidden;
  padding: 28px 20px 40px;
  width: 100%;
}

.article-hero {
  border-bottom: var(--line);
  display: grid;
  gap: 18px;
  padding-bottom: 26px;
}

.article-hero h1 {
  font-family: "Archivo Black", "Arial Black", sans-serif;
  font-size: clamp(36px, 4.4vw, 64px);
  line-height: 0.9;
  margin: 0;
  overflow-wrap: anywhere;
}

@supports (font-size: 1cqw) {
  .article-hero h1 {
    font-size: clamp(36px, 9cqw, 72px);
  }
}

.kicker {
  font-family: "IBM Plex Mono", "Consolas", monospace;
  font-weight: 900;
  margin: 0;
}

.summary {
  border-left: 10px solid var(--red);
  font-size: 18px;
  margin: 0;
  padding-left: 12px;
}

.article-taxonomy {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.article-taxonomy span {
  border: 2px solid var(--ink);
  font-family: "IBM Plex Mono", "Consolas", monospace;
  font-size: 13px;
  font-weight: 900;
  line-height: 1.2;
  padding: 6px 8px;
}

.article-taxonomy span:first-child {
  background: var(--red);
  color: var(--paper);
}

.article-taxonomy span:not(:first-child) {
  background: var(--yellow);
  color: #11100d;
}

.article-hero-cover {
  border: var(--line);
  display: block;
  max-height: 420px;
  object-fit: cover;
  width: 100%;
}

.article-layout {
  align-items: start;
  display: grid;
  gap: 28px;
  grid-template-columns: minmax(0, 1fr) minmax(180px, 220px);
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

.prose :deep(h2),
.prose :deep(h3),
.prose :deep(h4) {
  font-family: "Archivo Black", "Arial Black", sans-serif;
  line-height: 1.05;
  margin: 2.2em 0 0.6em;
  scroll-margin-top: 96px;
}

.prose :deep(h2) {
  font-size: clamp(30px, 5vw, 50px);
}

.prose :deep(h3) {
  font-size: clamp(24px, 4vw, 34px);
}

.prose :deep(h4) {
  font-size: 22px;
}

.prose :deep(p),
.prose :deep(li) {
  line-height: 1.75;
  overflow-wrap: anywhere;
}

.prose :deep(a) {
  border-bottom: 2px solid var(--blue);
  color: var(--blue);
  font-weight: 800;
}

.prose :deep(blockquote) {
  border-left: 12px solid var(--yellow);
  font-size: 20px;
  font-weight: 800;
  margin: 24px 0;
  padding: 4px 0 4px 18px;
}

.prose :deep(ul),
.prose :deep(ol) {
  padding-left: 1.4em;
}

.prose :deep(img) {
  border: var(--line);
  display: block;
  height: auto;
  margin: 24px 0;
  max-width: 100%;
}

.prose :deep(table) {
  border-collapse: collapse;
  display: block;
  max-width: 100%;
  overflow-x: auto;
  white-space: nowrap;
}

.prose :deep(th),
.prose :deep(td) {
  border: 2px solid var(--ink);
  padding: 8px 10px;
}

.prose :deep(code) {
  background: rgba(29, 88, 168, 0.13);
  border: 1px solid currentColor;
  font-family: "IBM Plex Mono", "Consolas", monospace;
  font-size: 0.9em;
  padding: 0.12em 0.3em;
}

.prose :deep(.code-block-shell) {
  border: var(--line);
  margin: 24px 0;
  max-width: 100%;
  overflow: hidden;
}

.prose :deep(.code-block-header) {
  align-items: center;
  background: var(--yellow);
  border-bottom: var(--line);
  color: #11100d;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding: 8px 10px;
}

.prose :deep(.code-language) {
  font-family: "IBM Plex Mono", "Consolas", monospace;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.prose :deep(.copy-code-button) {
  background: var(--paper);
  border: 2px solid var(--ink);
  color: var(--ink);
  cursor: pointer;
  font: inherit;
  font-weight: 900;
  min-height: 34px;
  padding: 5px 10px;
}

.prose :deep(.code-block-shell pre) {
  background: #11100d;
  color: #f4f0e8;
  margin: 0;
  overflow-x: auto;
  padding: 16px;
}

.prose :deep(.code-block-shell code) {
  background: transparent;
  border: 0;
  color: inherit;
  display: block;
  padding: 0;
}

.article-toc {
  background: var(--paper-soft);
  border: var(--line);
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

.article-toc p {
  margin: 0;
}

.reference-form {
  display: grid;
  gap: 4px;
}

.image-asset-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  width: 100%;
}

.image-asset {
  background: var(--paper-soft);
  border: 2px solid var(--ink);
  color: var(--ink);
  cursor: pointer;
  display: grid;
  font: inherit;
  font-weight: 800;
  gap: 8px;
  min-height: 128px;
  padding: 8px;
  text-align: left;
}

.image-asset.is-selected {
  box-shadow: 0 0 0 4px var(--blue);
}

.image-asset img {
  aspect-ratio: 4 / 3;
  border: 2px solid var(--ink);
  object-fit: cover;
  width: 100%;
}

.image-asset span {
  overflow-wrap: anywhere;
}

.empty-reference {
  border: 2px dashed var(--blue);
  color: var(--blue);
  font-weight: 800;
  margin: 0;
  padding: 14px;
}

@media (max-width: 980px) {
  .writing-workbench {
    grid-template-columns: 1fr;
  }

  .article-layout {
    grid-template-columns: 1fr;
  }

  .article-sidebar {
    position: static;
  }
}
</style>
