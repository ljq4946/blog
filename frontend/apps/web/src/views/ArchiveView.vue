<template>
  <main class="content-band">
    <div class="section-head">
      <h1>归档</h1>
    </div>
    <section v-for="month in archive" :key="month.month" class="archive-month">
      <h2>{{ month.month }}</h2>
      <RouterLink v-for="post in month.posts" :key="post.id" :to="`/posts/${post.slug}`">{{ post.title }}</RouterLink>
    </section>
    <EmptyState v-if="!archive.length" title="归档暂无内容" />
  </main>
</template>

<script setup lang="ts">
import type { ArchiveMonth } from "@blog/shared";
import { onMounted, ref } from "vue";
import EmptyState from "../components/EmptyState.vue";
import { publicApi } from "../lib/api";

const archive = ref<ArchiveMonth[]>([]);
onMounted(async () => {
  try {
    archive.value = await publicApi.archive();
  } catch {
    archive.value = [];
  }
});
</script>
