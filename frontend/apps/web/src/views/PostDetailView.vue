<template>
  <main class="article-wrap" v-if="post">
    <p class="kicker">{{ formatDate(post.publishedAt) }}</p>
    <h1>{{ post.title }}</h1>
    <p class="summary">{{ post.summary }}</p>
    <article class="prose" v-html="post.contentHtml"></article>
  </main>
</template>

<script setup lang="ts">
import { formatDate, type Post } from "@blog/shared";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { publicApi } from "../lib/api";

const route = useRoute();
const post = ref<Post | null>(null);

onMounted(async () => {
  try {
    post.value = await publicApi.post(String(route.params.slug));
  } catch {
    post.value = null;
  }
});
</script>
