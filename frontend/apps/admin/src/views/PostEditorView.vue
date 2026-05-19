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
      <div class="editor-primary-grid">
        <div class="editor-main-fields">
          <el-form-item label="标题">
            <el-input v-model="form.title" aria-label="标题" @blur="syncSlug" />
          </el-form-item>
          <div class="editor-inline-grid">
            <el-form-item label="摘要">
              <el-input v-model="form.summary" aria-label="摘要" type="textarea" :rows="3" />
            </el-form-item>
            <el-form-item label="URL 标识">
              <el-input v-model="form.slug" aria-label="URL 标识" />
            </el-form-item>
          </div>
        </div>

        <el-form-item label="封面图" class="cover-field">
          <el-select v-model="form.coverMediaId" clearable placeholder="选择媒体库图片">
            <el-option v-for="asset in mediaAssets" :key="asset.id" :label="asset.originalName" :value="asset.id" />
          </el-select>
          <div class="cover-preview">
            <img v-if="selectedCover" :src="selectedCover.url" :alt="selectedCover.originalName" />
            <span v-else>选择媒体库图片作为文章封面</span>
          </div>
        </el-form-item>
      </div>

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

      <div class="editor-meta-grid">
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option label="草稿" value="DRAFT" />
            <el-option label="已发布" value="PUBLISHED" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.categoryId" clearable>
            <el-option v-for="category in categories" :key="category.id" :label="category.name" :value="category.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-select v-model="form.tagIds" multiple>
            <el-option v-for="tag in tags" :key="tag.id" :label="tag.name" :value="tag.id" />
          </el-select>
        </el-form-item>
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
import { postFormSnapshot, publishChecklist, toPostInput, validatePostForm, wordCountFromHtml, type PostForm } from "../features/posts/postForm";
import { adminApi } from "../lib/api";

type SaveState = "idle" | "saving" | "saved" | "error";
type EditorMode = "edit" | "preview";

const route = useRoute();
const router = useRouter();
const isNew = computed(() => route.params.id === undefined);
const categories = ref<Category[]>([]);
const tags = ref<Tag[]>([]);
const mediaAssets = ref<MediaAsset[]>([]);
const errors = ref<string[]>([]);
const saveError = ref("");
const publishCheckError = ref("");
const saveState = ref<SaveState>("idle");
const activeMode = ref<EditorMode>("edit");
const lastSavedAt = ref("");
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
const publishChecks = computed(() => publishChecklist(form));
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
  }
);

function syncSlug() {
  if (!form.slug && form.title) {
    form.slug = slugify(form.title);
  }
}

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "操作失败，请稍后重试";
}

function refreshSavedSnapshot() {
  lastSavedSnapshot.value = postFormSnapshot(form);
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
  try {
    const saved = isNew.value
      ? await adminApi.createPost(toPostInput(form))
      : await adminApi.updatePost(Number(route.params.id), toPostInput(form));
    refreshSavedSnapshot();
    saveState.value = "saved";
    if (isNew.value && saved.id) {
      await router.replace(`/posts/${saved.id}`);
    }
  } catch (err) {
    saveState.value = "error";
    saveError.value = errorMessage(err);
  }
}

function goBack() {
  if (confirmLeave()) {
    router.push("/posts");
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
      Object.assign(form, {
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
      editor.value?.commands.setContent(form.contentHtml ?? "");
    }
  }
  refreshSavedSnapshot();
  saveState.value = "idle";
});

onBeforeUnmount(() => {
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

.editor-primary-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr);
  gap: 14px;
  align-items: stretch;
}

.editor-main-fields {
  display: grid;
  gap: 10px;
}

.editor-inline-grid,
.editor-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.editor-meta-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.cover-field :deep(.el-form-item__content) {
  align-content: start;
  display: grid;
  gap: 10px;
}

.cover-preview {
  align-items: center;
  background:
    repeating-linear-gradient(135deg, rgba(29, 88, 168, 0.12), rgba(29, 88, 168, 0.12) 8px, transparent 8px, transparent 16px),
    #fffaf0;
  border: 2px dashed var(--blue);
  color: var(--blue);
  display: grid;
  font-weight: 800;
  min-height: 92px;
  overflow: hidden;
  padding: 10px;
  place-items: center;
  text-align: center;
}

.cover-preview img {
  display: block;
  max-height: 140px;
  max-width: 100%;
  object-fit: cover;
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

@media (max-width: 900px) {
  .editor-primary-grid,
  .editor-inline-grid,
  .editor-meta-grid {
    grid-template-columns: 1fr;
  }
}
</style>
