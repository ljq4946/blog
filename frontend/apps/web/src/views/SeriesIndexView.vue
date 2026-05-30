<template>
  <main class="content-band knowledge-index">
    <div class="section-head">
      <h1>系列</h1>
      <p>按顺序阅读完整技术路径。</p>
    </div>

    <div v-if="series.length" class="knowledge-grid">
      <RouterLink v-for="item in series" :key="item.id" class="knowledge-card" :to="`/series/${item.slug}`">
        <strong>{{ item.name }}</strong>
        <span>{{ item.description || "暂无描述" }}</span>
        <em v-if="item.primaryTopic">{{ item.primaryTopic.name }}</em>
      </RouterLink>
    </div>
    <EmptyState v-else title="暂无系列" />
  </main>
</template>

<script setup lang="ts">
import type { Series } from "@blog/shared";
import { onMounted, ref } from "vue";
import EmptyState from "../components/EmptyState.vue";
import { publicApi } from "../lib/api";

const series = ref<Series[]>([]);

onMounted(async () => {
  try {
    series.value = await publicApi.seriesList();
  } catch {
    series.value = [];
  }
});
</script>
