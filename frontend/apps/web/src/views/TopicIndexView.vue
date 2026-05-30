<template>
  <main class="content-band knowledge-index">
    <div class="section-head">
      <h1>专题</h1>
      <p>按长期技术主题浏览文章。</p>
    </div>

    <div v-if="topics.length" class="knowledge-grid">
      <RouterLink v-for="topic in topics" :key="topic.id" class="knowledge-card" :to="`/topics/${topic.slug}`">
        <strong>{{ topic.name }}</strong>
        <span>{{ topic.description || "暂无描述" }}</span>
      </RouterLink>
    </div>
    <EmptyState v-else title="暂无专题" />
  </main>
</template>

<script setup lang="ts">
import type { Topic } from "@blog/shared";
import { onMounted, ref } from "vue";
import EmptyState from "../components/EmptyState.vue";
import { publicApi } from "../lib/api";

const topics = ref<Topic[]>([]);

onMounted(async () => {
  try {
    topics.value = await publicApi.topics();
  } catch {
    topics.value = [];
  }
});
</script>
