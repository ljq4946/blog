<template>
  <section class="panel">
    <div class="page-head">
      <h1>文章</h1>
      <el-button data-test="new-post" type="danger" @click="router.push('/posts/new')">新建文章</el-button>
    </div>
    <div class="post-tools">
      <input data-test="post-search" v-model="keyword" placeholder="搜索标题、URL、分类、标签、专题、系列" />
      <select data-test="status-filter" v-model="statusFilter" aria-label="状态筛选">
        <option value="ALL">全部状态</option>
        <option value="DRAFT">草稿</option>
        <option value="SCHEDULED">已排期</option>
        <option value="PUBLISHED">已发布</option>
      </select>
      <input data-test="taxonomy-filter" v-model="taxonomyKeyword" placeholder="分类 / 标签 / 专题 / 系列" />
    </div>
    <el-table :data="filteredPosts" border>
      <el-table-column prop="title" label="标题" min-width="220" />
      <el-table-column prop="slug" label="URL 标识" min-width="180" />
      <el-table-column label="状态" width="130">
        <template #default="{ row }">{{ statusLabel(row.status) }}</template>
      </el-table-column>
      <el-table-column label="内容结构" min-width="220">
        <template #default="{ row }">
          <div class="structure-cell">
            <span v-if="row.category">{{ row.category.name }}</span>
            <span v-for="topic in row.topics ?? []" :key="topic.id">{{ topic.name }}</span>
            <span v-if="row.series">{{ row.series.name }}</span>
            <span v-for="tag in row.tags ?? []" :key="tag.id">#{{ tag.name }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="发布时间" width="150">
        <template #default="{ row }">{{ formatDate(row.publishedAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="190">
        <template #default="{ row }">
          <el-button size="small" @click="router.push(`/posts/${row.id}`)">编辑</el-button>
          <el-button size="small" type="danger" @click="remove(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </section>
</template>

<script setup lang="ts">
import { formatDate, type Post } from "@blog/shared";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { adminApi } from "../lib/api";

const posts = ref<Post[]>([]);
const keyword = ref("");
const taxonomyKeyword = ref("");
const statusFilter = ref<Post["status"] | "ALL">("ALL");
const router = useRouter();

const filteredPosts = computed(() => {
  const search = normalize(keyword.value);
  const taxonomy = normalize(taxonomyKeyword.value);
  return posts.value.filter((post) => {
    if (statusFilter.value !== "ALL" && post.status !== statusFilter.value) {
      return false;
    }
    if (search && !postText(post).includes(search)) {
      return false;
    }
    if (taxonomy && !taxonomyText(post).includes(taxonomy)) {
      return false;
    }
    return true;
  });
});

async function load() {
  posts.value = await adminApi.posts();
}

async function remove(id: number) {
  await adminApi.deletePost(id);
  await load();
}

function statusLabel(status: Post["status"]) {
  if (status === "PUBLISHED") {
    return "已发布";
  }
  if (status === "SCHEDULED") {
    return "已排期";
  }
  return "草稿";
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function postText(post: Post) {
  return normalize([
    post.title,
    post.slug,
    post.summary,
    taxonomyText(post)
  ].filter(Boolean).join(" "));
}

function taxonomyText(post: Post) {
  return normalize([
    post.category?.name,
    post.category?.slug,
    ...(post.topics ?? []).flatMap((topic) => [topic.name, topic.slug]),
    post.series?.name,
    post.series?.slug,
    ...(post.tags ?? []).flatMap((tag) => [tag.name, tag.slug])
  ].filter(Boolean).join(" "));
}

onMounted(load);
</script>

<style scoped>
.post-tools {
  display: grid;
  gap: 10px;
  grid-template-columns: minmax(240px, 1fr) minmax(140px, 180px) minmax(220px, 300px);
  margin-bottom: 14px;
}

.post-tools input,
.post-tools select {
  background: var(--paper);
  border: 2px solid var(--ink);
  color: var(--ink);
  font: inherit;
  font-weight: 800;
  min-height: 38px;
  padding: 6px 10px;
}

.structure-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.structure-cell span {
  background: var(--paper-soft);
  border: 2px solid var(--ink);
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
  padding: 4px 6px;
}

@media (max-width: 900px) {
  .post-tools {
    grid-template-columns: 1fr;
  }
}
</style>
