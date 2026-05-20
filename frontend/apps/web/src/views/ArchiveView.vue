<template>
  <main class="content-band">
    <div class="section-head">
      <h1>归档</h1>
    </div>
    <section v-for="month in archive" :key="month.month" class="archive-month">
      <h2>{{ month.month }}</h2>
      <div class="archive-post-list">
        <article v-for="post in month.posts" :key="post.id" class="archive-post-item">
          <img
            v-if="post.coverMediaUrl"
            class="archive-post-cover"
            :src="post.coverMediaUrl"
            :alt="post.title"
          >
          <span v-else class="archive-post-cover archive-post-cover--empty" aria-hidden="true" />
          <div class="archive-post-copy">
            <RouterLink class="archive-post-title" :to="`/posts/${post.slug}`">{{ post.title }}</RouterLink>
            <div class="archive-post-meta">
              <RouterLink v-if="post.category" :to="`/categories/${post.category.slug}`">
                {{ post.category.name }}
              </RouterLink>
              <span v-else>未分类</span>
              <template v-if="post.tags?.length">
                <RouterLink v-for="tag in post.tags" :key="tag.id" :to="`/tags/${tag.slug}`">#{{ tag.name }}</RouterLink>
              </template>
              <span v-else>无标签</span>
            </div>
          </div>
        </article>
      </div>
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
