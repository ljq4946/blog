<template>
  <main class="content-band">
    <div class="section-head">
      <h1>{{ type === "category" ? "分类" : "标签" }} / {{ slug }}</h1>
    </div>
    <div v-if="posts.length" class="post-grid">
      <PostCard v-for="post in posts" :key="post.id" :post="post" />
    </div>
    <EmptyState v-else title="这里还没有文章" />
  </main>
</template>

<script setup lang="ts">
import type { Post } from "@blog/shared";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import EmptyState from "../components/EmptyState.vue";
import PostCard from "../components/PostCard.vue";
import { publicApi } from "../lib/api";

const props = defineProps<{ type: "category" | "tag" }>();
const route = useRoute();
const slug = String(route.params.slug);
const posts = ref<Post[]>([]);

onMounted(async () => {
  try {
    posts.value = await publicApi.posts(props.type === "category" ? { category: slug } : { tag: slug });
  } catch {
    posts.value = [];
  }
});
</script>
