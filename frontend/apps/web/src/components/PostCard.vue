<template>
  <article class="post-card">
    <RouterLink class="post-card-cover-link" :to="`/posts/${post.slug}`">
      <img v-if="post.coverMediaUrl" class="post-card-cover" :src="post.coverMediaUrl" :alt="post.title" loading="lazy" />
      <span v-else class="post-card-cover post-card-cover--empty" aria-hidden="true" />
    </RouterLink>
    <div class="post-card-body">
      <RouterLink class="post-card-link" :to="`/posts/${post.slug}`">
        <span class="date">{{ formatDate(post.publishedAt) }}</span>
        <h2>{{ post.title }}</h2>
        <p>{{ post.summary }}</p>
      </RouterLink>
      <div class="post-card-meta">
        <RouterLink v-if="post.category" class="post-card-category" :to="`/categories/${post.category.slug}`">
          {{ post.category.name }}
        </RouterLink>
        <span v-else class="post-card-category post-card-category-fallback">未分类</span>
        <div class="post-card-tags">
          <template v-if="post.tags?.length">
            <RouterLink v-for="(tag, index) in post.tags" :key="tag.id" :to="`/tags/${tag.slug}`">
              {{ index > 0 ? " " : "" }}#{{ tag.name }}
            </RouterLink>
          </template>
          <span v-else>无标签</span>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { formatDate, type Post } from "@blog/shared";

defineProps<{ post: Post }>();
</script>
