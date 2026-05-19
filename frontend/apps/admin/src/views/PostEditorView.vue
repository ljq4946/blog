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
              <el-button @click="editor?.chain().focus().toggleBold().run()">B</el-button>
              <el-button @click="editor?.chain().focus().toggleItalic().run()">I</el-button>
              <el-button @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()">H2</el-button>
              <el-button @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()">H3</el-button>
              <el-button @click="editor?.chain().focus().toggleBulletList().run()">列表</el-button>
              <el-button @click="editor?.chain().focus().toggleBlockquote().run()">引用</el-button>
              <el-button @click="insertLink">链接</el-button>
              <el-button @click="insertImage">图片</el-button>
              <el-button @click="editor?.chain().focus().toggleCodeBlock().run()">代码</el-button>
              <el-button @click="editor?.chain().focus().undo().run()">撤销</el-button>
              <el-button @click="editor?.chain().focus().redo().run()">重做</el-button>
            </div>

            <EditorContent v-if="editor" class="editor-surface" :editor="editor" />
          </template>

          <article v-else class="editor-preview">
            <p class="preview-kicker">文章预览</p>
            <h2>{{ form.title || "未命名文章" }}</h2>
            <p v-if="form.summary" class="preview-summary">{{ form.summary }}</p>
            <img v-if="selectedCover" :src="selectedCover.url" :alt="selectedCover.originalName" />
            <div class="preview-content" v-html="form.contentHtml"></div>
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
  </section>
</template>

<script setup lang="ts">
import { slugify, type Category, type MediaAsset, type Post, type Tag } from "@blog/shared";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
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
import { adminApi } from "../lib/api";
import PostPublishPanel from "./PostPublishPanel.vue";

type SaveState = "idle" | "saving" | "saved" | "error";
type EditorMode = "edit" | "preview";
type SaveMode = "manual" | "autosave";
let autosaveTimer: ReturnType<typeof window.setTimeout> | null = null;
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
const mediaAssets = ref<MediaAsset[]>([]);
const errors = ref<string[]>([]);
const saveError = ref("");
const publishCheckError = ref("");
const saveState = ref<SaveState>("idle");
const saveMode = ref<SaveMode>("manual");
const activeMode = ref<EditorMode>("edit");
const lastSavedAt = ref("");
const lastAutosavedAt = ref("");
const lastPersistedStatus = ref<Post["status"]>("DRAFT");
const form = reactive<PostForm>({
  title: "",
  slug: "",
  summary: "",
  contentHtml: "",
  coverMediaId: null,
  status: "DRAFT",
  categoryId: null,
  tagIds: []
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
const isAutosaveDirty = computed(() => autosaveFormSnapshot() !== lastSavedSnapshot.value);
const wordCount = computed(() => wordCountFromHtml(form.contentHtml));
const selectedCover = computed(() => mediaAssets.value.find((asset) => asset.id === form.coverMediaId) ?? null);
const publishChecks = computed(() => publishChecklist(form));
const recoveryKey = computed(() => postRecoveryKey(currentPostId.value === null ? null : currentPostId.value.toString()));
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
    const savedLabel = saveMode.value === "autosave" ? "已自动保存" : "已保存";
    const savedAt = saveMode.value === "autosave" ? lastAutosavedAt.value : lastSavedAt.value;
    return `${savedLabel}${savedAt ? ` ${savedAt}` : ""} · ${wordCount.value} 字 · ${status}`;
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
      if (isAutosaveDirty.value) {
        queueAutosave();
      }
    }
  }
);

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
    recoverySnapshot.value = postFormSnapshot(parsed.form) !== lastSavedSnapshot.value ? parsed : null;
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

function autosaveFormSnapshot() {
  return postFormSnapshot({
    ...form,
    tagIds: [...form.tagIds],
    status: lastPersistedStatus.value
  });
}

function refreshSavedSnapshot(snapshot = postFormSnapshot(form), persistedStatus = form.status) {
  lastSavedSnapshot.value = snapshot;
  lastPersistedStatus.value = persistedStatus;
  lastSavedAt.value = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());
}

async function save(status?: Post["status"], mode: SaveMode = "manual") {
  saveError.value = "";
  publishCheckError.value = "";
  errors.value = [];
  saveMode.value = mode;
  if (status === "PUBLISHED" && hasBlockingPublishChecks.value) {
    publishCheckError.value = "请先完成必填发布检查";
    saveState.value = "error";
    return;
  }
  if (status) {
    form.status = status;
  }
  const autosavePersistedStatus = mode === "autosave" ? lastPersistedStatus.value : form.status;
  errors.value = validatePostForm(form);
  if (errors.value.length) {
    return;
  }

  saveState.value = "saving";
  const wasNew = isNew.value;
  const recoveryKeyBeforeSave = recoveryKey.value;
  const submittedForm: PostForm = {
    ...form,
    tagIds: [...form.tagIds],
    status: autosavePersistedStatus
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
    refreshSavedSnapshot(submittedSnapshot, submittedForm.status);
    if (mode === "autosave") {
      lastAutosavedAt.value = lastSavedAt.value;
    }
    if (autosaveFormSnapshot() !== submittedSnapshot) {
      saveState.value = "idle";
      writeRecoverySnapshot();
      if (canAutosavePost(form, { isNew: isNew.value })) {
        queueAutosave();
      }
      return;
    }
    if (postFormSnapshot(form) !== submittedSnapshot) {
      saveState.value = "idle";
      writeRecoverySnapshot();
      return;
    }
    saveState.value = "saved";
    clearRecoverySnapshot();
  } catch (err) {
    saveState.value = "error";
    saveError.value = mode === "autosave" ? `自动保存失败：${errorMessage(err)}` : errorMessage(err);
  }
}

function queueAutosave() {
  if (autosaveTimer) {
    window.clearTimeout(autosaveTimer);
  }
  autosaveTimer = window.setTimeout(() => {
    autosaveTimer = null;
    if (saveState.value === "saving" || !isAutosaveDirty.value || !canAutosavePost(form, { isNew: isNew.value })) {
      return;
    }
    void save(undefined, "autosave");
  }, 1200);
}

function goBack() {
  if (confirmLeave()) {
    router.push("/posts");
  }
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

function insertLink() {
  const href = window.prompt("请输入链接 URL");
  if (!href?.trim()) {
    return;
  }
  editor.value?.chain().focus().setLink({ href: href.trim() }).run();
}

function insertImage() {
  const src = window.prompt("请输入图片 URL");
  if (!src?.trim()) {
    return;
  }
  editor.value?.chain().focus().setImage({ src: src.trim() }).run();
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
  const [loadedCategories, loadedTags] = await Promise.all([adminApi.categories(), adminApi.tags()]);
  categories.value = loadedCategories;
  tags.value = loadedTags;

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
        tagIds: current.tags?.map((tag) => tag.id) ?? [],
        publishedAt: current.publishedAt ?? null
      });
    }
  }
  refreshSavedSnapshot();
  saveState.value = "idle";
  loadRecoverySnapshot();
  recoveryWritesReady.value = true;
});

onBeforeUnmount(() => {
  isUnmounted = true;
  if (autosaveTimer) {
    window.clearTimeout(autosaveTimer);
  }
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
  background: #fffaf0;
  border: 2px solid var(--ink);
  padding: 8px;
}

.toolbar .el-button {
  margin-left: 0;
}

.mode-actions {
  justify-content: flex-end;
}

.editor-preview {
  background: #ffffff;
  border: 2px solid var(--ink);
  display: grid;
  gap: 12px;
  padding: 18px;
}

.preview-kicker {
  color: var(--blue);
  font-weight: 900;
  margin: 0;
}

.editor-preview h2,
.preview-summary {
  margin: 0;
}

.editor-preview img {
  display: block;
  max-height: 260px;
  max-width: 100%;
  object-fit: cover;
}

.preview-content :deep(p:first-child) {
  margin-top: 0;
}

.preview-content :deep(p:last-child) {
  margin-bottom: 0;
}

@media (max-width: 980px) {
  .writing-workbench {
    grid-template-columns: 1fr;
  }
}
</style>
