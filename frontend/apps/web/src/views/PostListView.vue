<template>
  <main class="content-band">
    <div class="section-head">
      <h1>文章</h1>
    </div>
    <div v-if="posts.length" class="post-grid">
      <PostCard v-for="post in posts" :key="post.id" :post="post" />
    </div>
    <EmptyState v-else title="暂无已发布文章" />
  </main>
</template>

<script setup lang="ts">
import type { Post } from "@blog/shared";
import { onMounted, ref } from "vue";
import EmptyState from "../components/EmptyState.vue";
import PostCard from "../components/PostCard.vue";
import { publicApi } from "../lib/api";

const posts = ref<Post[]>([]);
onMounted(async () => {
  try {
    posts.value = await publicApi.posts();
  } catch {
    posts.value = [];
  }
});
</script>
