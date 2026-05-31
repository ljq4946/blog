<template>
  <section class="panel knowledge-page">
    <div class="page-head">
      <div>
        <h1>知识库</h1>
        <p>收集私有笔记，并把成熟内容转成公开文章草稿。</p>
      </div>
      <el-button data-test="export-knowledge" @click="exportKnowledge">导出备份</el-button>
    </div>

    <div class="knowledge-layout">
      <section class="knowledge-card">
        <h2>快速记录</h2>
        <div class="note-form">
          <input data-test="note-title" v-model="draft.title" placeholder="标题" @blur="syncSlug" />
          <input data-test="note-slug" v-model="draft.slug" placeholder="URL 标识" />
          <input data-test="note-summary" v-model="draft.summary" placeholder="摘要" />
          <textarea data-test="note-content" v-model="draft.content" rows="7" placeholder="私有笔记正文"></textarea>
          <el-button data-test="create-note" type="danger" :disabled="!canCreateNote" @click="createNote">保存私有笔记</el-button>
        </div>
      </section>

      <section class="knowledge-card note-list-card">
        <div class="knowledge-tools">
          <input data-test="knowledge-search" v-model="keyword" placeholder="搜索标题、正文、标签、专题、系列" />
          <el-button @click="loadNotes">搜索</el-button>
        </div>

        <el-table :data="notes" border>
          <el-table-column prop="title" label="笔记" min-width="220">
            <template #default="{ row }">
              <strong>{{ row.title }}</strong>
              <p>{{ row.summary || "暂无摘要" }}</p>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="130">
            <template #default="{ row }">{{ row.visibility }} / {{ row.contentType }}</template>
          </el-table-column>
          <el-table-column label="动作" width="210">
            <template #default="{ row }">
              <el-button size="small" @click="router.push(`/posts/${row.id}`)">编辑</el-button>
              <el-button
                size="small"
                type="warning"
                :data-test="`convert-note-${row.id}`"
                @click="convertNote(row.id)"
              >
                转文章
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </section>

      <section class="knowledge-card relation-card">
        <h2>内容关系</h2>
        <div class="relation-form">
          <input v-model.number="relationForm.sourcePostId" type="number" placeholder="来源内容 ID" />
          <input v-model.number="relationForm.targetPostId" type="number" placeholder="目标内容 ID" />
          <select v-model="relationForm.type" aria-label="关系类型">
            <option value="RELATED">相关</option>
            <option value="SOURCE">来源</option>
            <option value="FOLLOW_UP">后续</option>
            <option value="EXPANDS">扩展</option>
          </select>
          <el-button :disabled="!canCreateRelation" @click="createRelation">建立关系</el-button>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { slugify, type KnowledgeRelationType, type Post } from "@blog/shared";
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { adminApi } from "../lib/api";

const router = useRouter();
const notes = ref<Post[]>([]);
const keyword = ref("");
const draft = reactive({
  title: "",
  slug: "",
  summary: "",
  content: ""
});
const relationForm = reactive<{
  sourcePostId: number | null;
  targetPostId: number | null;
  type: KnowledgeRelationType;
}>({
  sourcePostId: null,
  targetPostId: null,
  type: "RELATED"
});

const canCreateNote = computed(() => draft.title.trim() && draft.slug.trim());
const canCreateRelation = computed(() =>
  Number.isFinite(relationForm.sourcePostId) &&
  Number.isFinite(relationForm.targetPostId) &&
  relationForm.sourcePostId !== relationForm.targetPostId
);

async function loadNotes() {
  const filters = {
    visibility: "PRIVATE",
    contentType: "NOTE"
  } as const;
  const response = await adminApi.knowledgeSearch(keyword.value.trim()
    ? { ...filters, keyword: keyword.value.trim() }
    : filters);
  notes.value = response.content;
}

function syncSlug() {
  if (!draft.slug && draft.title) {
    draft.slug = slugify(draft.title);
  }
}

async function createNote() {
  if (!canCreateNote.value) {
    return;
  }
  await adminApi.createPost({
    title: draft.title,
    slug: draft.slug,
    summary: draft.summary,
    contentHtml: `<p>${escapeHtml(draft.content).replace(/\n/g, "</p><p>")}</p>`,
    status: "DRAFT",
    visibility: "PRIVATE",
    contentType: "NOTE",
    categoryId: null,
    topicIds: [],
    seriesId: null,
    seriesOrder: null,
    tagIds: [],
    publishedAt: null
  });
  draft.title = "";
  draft.slug = "";
  draft.summary = "";
  draft.content = "";
  await loadNotes();
}

async function convertNote(id: number) {
  const converted = await adminApi.convertNoteToArticle(id);
  router.push(`/posts/${converted.id}`);
}

async function createRelation() {
  if (!canCreateRelation.value || relationForm.sourcePostId === null || relationForm.targetPostId === null) {
    return;
  }
  await adminApi.createKnowledgeRelation({
    sourcePostId: relationForm.sourcePostId,
    targetPostId: relationForm.targetPostId,
    type: relationForm.type
  });
  relationForm.sourcePostId = null;
  relationForm.targetPostId = null;
  relationForm.type = "RELATED";
}

async function exportKnowledge() {
  await adminApi.exportKnowledge();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

onMounted(loadNotes);
</script>

<style scoped>
.knowledge-page {
  display: grid;
  gap: 16px;
}

.page-head p {
  color: var(--blue);
  font-weight: 800;
  margin: 6px 0 0;
}

.knowledge-layout {
  align-items: start;
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(260px, 340px) minmax(0, 1fr);
}

.knowledge-card {
  background: var(--paper-soft);
  border: 2px solid var(--ink);
  box-shadow: 6px 6px 0 rgba(17, 16, 13, 0.16);
  display: grid;
  gap: 12px;
  padding: 14px;
}

.knowledge-card h2 {
  font-family: "Archivo Black", "Arial Black", sans-serif;
  font-size: 18px;
  margin: 0;
}

.note-form,
.knowledge-tools,
.relation-form {
  display: grid;
  gap: 10px;
}

.knowledge-tools,
.relation-form {
  grid-template-columns: minmax(0, 1fr) auto;
}

.note-form input,
.note-form textarea,
.knowledge-tools input,
.relation-form input,
.relation-form select {
  background: var(--paper);
  border: 2px solid var(--ink);
  color: var(--ink);
  font: inherit;
  font-weight: 800;
  padding: 8px 10px;
  width: 100%;
}

.relation-card {
  grid-column: 1 / -1;
}

.note-form textarea {
  resize: vertical;
}

.note-list-card :deep(td p) {
  color: var(--blue);
  font-size: 13px;
  font-weight: 800;
  margin: 4px 0 0;
}

@media (max-width: 900px) {
  .knowledge-layout,
  .knowledge-tools {
    grid-template-columns: 1fr;
  }
}
</style>
