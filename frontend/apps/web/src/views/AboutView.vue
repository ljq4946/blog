<template>
  <main class="article-wrap">
    <h1>{{ page.title }}</h1>
    <article class="prose" v-html="page.contentHtml"></article>
  </main>
</template>

<script setup lang="ts">
import type { SitePage } from "@blog/shared";
import { onMounted, ref } from "vue";
import { publicApi } from "../lib/api";

const page = ref<SitePage>({ key: "about", title: "关于", contentHtml: "", updatedAt: "" });
onMounted(async () => {
  try {
    page.value = await publicApi.about();
  } catch {
    page.value = { key: "about", title: "关于", contentHtml: "", updatedAt: "" };
  }
});
</script>
