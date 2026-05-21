<template>
  <ReadingProgress />

  <main v-if="post" class="article-page">
    <header class="article-hero">
      <p class="kicker">{{ formatDate(post.publishedAt) }}</p>
      <div class="article-taxonomy">
        <RouterLink v-if="post.category" :to="`/categories/${post.category.slug}`">{{ post.category.name }}</RouterLink>
        <span v-for="tag in post.tags ?? []" :key="tag.id">#{{ tag.name }}</span>
      </div>
      <h1>{{ post.title }}</h1>
      <p v-if="post.summary" class="summary">{{ post.summary }}</p>
      <img v-if="post.coverMediaUrl" class="article-hero-cover" :src="post.coverMediaUrl" :alt="post.title" />
    </header>

    <div class="article-layout">
      <ArticleRenderer class="article-content" :content-html="post.contentHtml" @toc-change="tocItems = $event" />
      <aside class="article-sidebar">
        <ReadingPreferences />
        <ArticleToc :items="tocItems" :active-id="activeHeadingId" @navigate="navigateToHeading" />
      </aside>
    </div>

    <button data-test="back-to-top" class="back-to-top" type="button" @click="scrollToTop">Back to top</button>
  </main>

  <main v-else-if="loadFailed" class="content-band article-error">
    <h1>Article unavailable</h1>
    <p>The article could not be loaded. It may have moved or is not published.</p>
    <RouterLink to="/archive">Return to archive</RouterLink>
  </main>
</template>

<script setup lang="ts">
import { formatDate, type Post } from "@blog/shared";
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import ArticleRenderer from "../components/reading/ArticleRenderer.vue";
import ArticleToc from "../components/reading/ArticleToc.vue";
import ReadingPreferences from "../components/reading/ReadingPreferences.vue";
import ReadingProgress from "../components/reading/ReadingProgress.vue";
import type { TocItem } from "../features/reading/articleEnhancements";
import { publicApi } from "../lib/api";

const route = useRoute();
const post = ref<Post | null>(null);
const loadFailed = ref(false);
const tocItems = ref<TocItem[]>([]);
const activeHeadingId = ref("");

function navigateToHeading(id: string) {
  const target = document.getElementById(id);
  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });
  activeHeadingId.value = id;
}

function updateActiveHeading() {
  let activeId = "";
  for (const item of tocItems.value) {
    const heading = document.getElementById(item.id);
    if (heading && heading.getBoundingClientRect().top <= 120) {
      activeId = item.id;
    }
  }
  activeHeadingId.value = activeId || tocItems.value[0]?.id || "";
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

onMounted(async () => {
  try {
    post.value = await publicApi.post(String(route.params.slug));
    await nextTick();
    updateActiveHeading();
  } catch {
    loadFailed.value = true;
    post.value = null;
  }

  window.addEventListener("scroll", updateActiveHeading, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", updateActiveHeading);
});
</script>
