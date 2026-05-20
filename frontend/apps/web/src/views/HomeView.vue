<template>
  <main>
    <section class="hero-grid">
      <div>
        <h1>4946个人站</h1>
      </div>
      <div class="plate red"></div>
      <div class="plate blue"></div>
      <div class="plate yellow"></div>
    </section>
    <section class="content-band">
      <div class="section-head">
        <h2>最新文章</h2>
      </div>
      <div v-if="posts.length" class="post-grid">
        <PostCard v-for="post in posts.slice(0, 3)" :key="post.id" :post="post" />
      </div>
      <EmptyState v-else title="暂无已发布文章" />
    </section>
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
