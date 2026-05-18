<template>
  <section>
    <div class="page-head">
      <h1>控制台</h1>
    </div>
    <div class="metric-grid">
      <article class="metric">
        <b>{{ posts.length }}</b>
        <span>文章</span>
      </article>
      <article class="metric">
        <b>{{ published }}</b>
        <span>已发布</span>
      </article>
      <article class="metric">
        <b>{{ drafts }}</b>
        <span>草稿</span>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { Post } from "@blog/shared";
import { adminApi } from "../lib/api";

const posts = ref<Post[]>([]);
const published = computed(() => posts.value.filter((post) => post.status === "PUBLISHED").length);
const drafts = computed(() => posts.value.filter((post) => post.status === "DRAFT").length);

onMounted(async () => {
  posts.value = await adminApi.posts();
});
</script>
