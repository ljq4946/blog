<template>
  <article class="post-card">
    <RouterLink :to="`/posts/${post.slug}`">
      <span class="date">{{ formatDate(post.publishedAt) }}</span>
      <h2>{{ post.title }}</h2>
      <p>{{ post.summary }}</p>
    </RouterLink>
    <footer>
      <RouterLink v-if="post.category" :to="`/categories/${post.category.slug}`">{{ post.category.name }}</RouterLink>
      <RouterLink v-for="tag in post.tags ?? []" :key="tag.id" :to="`/tags/${tag.slug}`">#{{ tag.name }}</RouterLink>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { formatDate, type Post } from "@blog/shared";

defineProps<{ post: Post }>();
</script>
