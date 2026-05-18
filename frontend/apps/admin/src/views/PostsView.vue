<template>
  <section class="panel">
    <div class="page-head">
      <h1>文章</h1>
      <el-button type="danger" @click="$router.push('/posts/new')">新建文章</el-button>
    </div>
    <el-table :data="posts" border>
      <el-table-column prop="title" label="标题" min-width="220" />
      <el-table-column prop="slug" label="URL 标识" min-width="180" />
      <el-table-column label="状态" width="130">
        <template #default="{ row }">{{ statusLabel(row.status) }}</template>
      </el-table-column>
      <el-table-column label="发布时间" width="150">
        <template #default="{ row }">{{ formatDate(row.publishedAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="190">
        <template #default="{ row }">
          <el-button size="small" @click="$router.push(`/posts/${row.id}`)">编辑</el-button>
          <el-button size="small" type="danger" @click="remove(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </section>
</template>

<script setup lang="ts">
import { formatDate, type Post } from "@blog/shared";
import { onMounted, ref } from "vue";
import { adminApi } from "../lib/api";

const posts = ref<Post[]>([]);

async function load() {
  posts.value = await adminApi.posts();
}

async function remove(id: number) {
  await adminApi.deletePost(id);
  await load();
}

function statusLabel(status: Post["status"]) {
  return status === "PUBLISHED" ? "已发布" : "草稿";
}

onMounted(load);
</script>
