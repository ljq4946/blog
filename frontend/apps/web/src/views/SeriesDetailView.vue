<template>
  <main class="content-band knowledge-detail">
    <div class="section-head">
      <div>
        <h1>{{ detail?.series.name ?? slug }}</h1>
        <p>{{ detail?.series.description }}</p>
      </div>
      <RouterLink v-if="detail?.series.primaryTopic" :to="`/topics/${detail.series.primaryTopic.slug}`">
        {{ detail.series.primaryTopic.name }}
      </RouterLink>
    </div>

    <ol v-if="detail?.posts.length" class="series-post-list">
      <li v-for="post in detail.posts" :key="post.id">
        <span>{{ post.seriesOrder }}</span>
        <RouterLink :to="`/posts/${post.slug}`">{{ post.title }}</RouterLink>
        <p v-if="post.summary">{{ post.summary }}</p>
      </li>
    </ol>
    <EmptyState v-else title="这个系列还没有文章" />
  </main>
</template>

<script setup lang="ts">
import type { SeriesDetail } from "@blog/shared";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import EmptyState from "../components/EmptyState.vue";
import { publicApi } from "../lib/api";

const route = useRoute();
const slug = String(route.params.slug);
const detail = ref<SeriesDetail | null>(null);

onMounted(async () => {
  try {
    detail.value = await publicApi.series(slug);
  } catch {
    detail.value = null;
  }
});
</script>
