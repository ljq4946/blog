<template>
  <section class="panel comments-admin">
    <div class="page-head">
      <div>
        <h1>评论</h1>
        <p>查看公开评论，删除不合适内容。</p>
      </div>
    </div>
    <el-alert v-if="error" type="error" :title="error" :closable="false" />
    <el-table :data="comments" border>
      <el-table-column prop="postTitle" label="文章" min-width="180" />
      <el-table-column prop="nickname" label="昵称" width="140" />
      <el-table-column prop="email" label="邮箱" min-width="180">
        <template #default="{ row }">{{ row.email || "未填写" }}</template>
      </el-table-column>
      <el-table-column prop="content" label="内容" min-width="260" />
      <el-table-column label="时间" width="150">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button
            :data-test="`delete-comment-${row.id}`"
            size="small"
            type="danger"
            @click="remove(row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </section>
</template>

<script setup lang="ts">
import { formatDate, type AdminComment } from "@blog/shared";
import { onMounted, ref } from "vue";
import { adminApi } from "../lib/api";

const comments = ref<AdminComment[]>([]);
const error = ref("");

async function load() {
  error.value = "";
  try {
    comments.value = await adminApi.comments();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "评论加载失败";
  }
}

async function remove(id: number) {
  error.value = "";
  try {
    await adminApi.deleteComment(id);
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "评论删除失败";
  }
}

onMounted(load);
</script>
