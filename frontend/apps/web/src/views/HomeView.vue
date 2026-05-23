<template>
  <main class="home-page">
    <section
      ref="posterRef"
      class="home-poster"
      :style="{ '--poster-scroll': posterScroll.toFixed(3) }"
      aria-labelledby="home-poster-title"
    >
      <div class="poster-cells" aria-hidden="true">
        <span class="poster-cell poster-cell--paper"></span>
        <span class="poster-cell poster-cell--yellow"></span>
        <span class="poster-cell poster-cell--paper"></span>
        <span class="poster-cell poster-cell--blue"></span>
        <span class="poster-cell poster-cell--paper"></span>
        <span class="poster-cell poster-cell--red"></span>
      </div>
      <div class="poster-stage">
        <div class="poster-copy">
          <p class="kicker poster-kicker">Public notebook / Index 4946</p>
          <h1 id="home-poster-title">4946个人站</h1>
          <p class="poster-tagline">In solitude, where we are least alone</p>
        </div>
        <div class="poster-index" aria-label="站点索引">
          <span>WRITING</span>
          <span>NOTES</span>
          <span>ARCHIVE</span>
        </div>
        <div class="poster-strike" aria-hidden="true">
          <span class="poster-circle"></span>
          <span class="poster-wedge poster-wedge-main"></span>
        </div>
        <span class="poster-wedge poster-wedge-small" aria-hidden="true"></span>
        <span class="poster-rule poster-rule-blue" aria-hidden="true"></span>
        <span class="poster-rule poster-rule-yellow" aria-hidden="true"></span>
      </div>
    </section>
    <section class="content-band latest-posts">
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
import { onBeforeUnmount, onMounted, ref } from "vue";
import EmptyState from "../components/EmptyState.vue";
import PostCard from "../components/PostCard.vue";
import { publicApi } from "../lib/api";

const posts = ref<Post[]>([]);
const posterRef = ref<HTMLElement | null>(null);
const posterScroll = ref(0);

function updatePosterScroll() {
  const poster = posterRef.value;
  if (!poster) {
    posterScroll.value = 0;
    return;
  }

  const rect = poster.getBoundingClientRect();
  const distance = Math.min(Math.max(-rect.top, 0), Math.max(rect.height, 1));
  posterScroll.value = distance / Math.max(rect.height, 1);
}

onMounted(async () => {
  updatePosterScroll();
  window.addEventListener("scroll", updatePosterScroll, { passive: true });
  try {
    posts.value = await publicApi.posts();
  } catch {
    posts.value = [];
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", updatePosterScroll);
});
</script>
