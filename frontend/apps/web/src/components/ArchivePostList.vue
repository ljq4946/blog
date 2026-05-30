<template>
  <div v-if="posts.length" class="archive-discovery-list">
    <article v-for="post in posts" :key="post.id" class="archive-discovery-item">
      <RouterLink class="archive-discovery-cover-link" :to="`/posts/${post.slug}`">
        <img v-if="post.coverMediaUrl" class="archive-discovery-cover" :src="post.coverMediaUrl" :alt="post.title" loading="lazy" />
        <span v-else class="archive-discovery-cover archive-discovery-cover--empty" aria-hidden="true" />
      </RouterLink>
      <div class="archive-discovery-copy">
        <span class="date">{{ formatDate(post.publishedAt) }}</span>
        <RouterLink class="archive-discovery-title" :to="`/posts/${post.slug}`">{{ post.title }}</RouterLink>
        <p v-if="post.summary">{{ post.summary }}</p>
        <div class="archive-post-meta">
          <RouterLink v-if="post.category" :to="`/categories/${post.category.slug}`">{{ post.category.name }}</RouterLink>
          <span v-else>未分类</span>
          <RouterLink v-if="post.series" :to="`/series/${post.series.slug}`">{{ post.series.name }}</RouterLink>
          <RouterLink v-for="topic in post.topics ?? []" :key="topic.id" :to="`/topics/${topic.slug}`">{{ topic.name }}</RouterLink>
          <template v-if="post.tags?.length">
            <RouterLink v-for="tag in post.tags" :key="tag.id" :to="`/tags/${tag.slug}`">#{{ tag.name }}</RouterLink>
          </template>
          <span v-else>无标签</span>
        </div>
      </div>
    </article>
  </div>
  <section v-else class="empty-state archive-empty">
    <p>没有匹配的文章</p>
    <button data-test="empty-reset" type="button" @click="$emit('reset')">重置筛选</button>
  </section>
</template>

<script setup lang="ts">
import { formatDate, type Post } from "@blog/shared";

defineProps<{ posts: Post[] }>();
defineEmits<{ reset: [] }>();
</script>
