<template>
  <main class="content-band knowledge-detail">
    <div class="section-head">
      <div>
        <h1>{{ detail?.topic.name ?? slug }}</h1>
        <p>{{ detail?.topic.description }}</p>
      </div>
    </div>

    <section v-if="detail?.relatedSeries.length" class="related-series">
      <h2>相关系列</h2>
      <RouterLink v-for="item in detail.relatedSeries" :key="item.id" :to="`/series/${item.slug}`">
        {{ item.name }}
      </RouterLink>
    </section>

    <div v-if="detail?.posts.length" class="post-grid">
      <PostCard v-for="post in detail.posts" :key="post.id" :post="post" />
    </div>
    <EmptyState v-else title="这个专题还没有文章" />
  </main>
</template>

<script setup lang="ts">
import type { TopicDetail } from "@blog/shared";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import EmptyState from "../components/EmptyState.vue";
import PostCard from "../components/PostCard.vue";
import { publicApi } from "../lib/api";
import { absoluteUrl, applySiteMetadata } from "../lib/siteMetadata";

const route = useRoute();
const slug = String(route.params.slug);
const detail = ref<TopicDetail | null>(null);

onMounted(async () => {
  try {
    detail.value = await publicApi.topic(slug);
    const topic = detail.value.topic;
    applySiteMetadata({
      title: topic.name,
      description: topic.description,
      path: `/topics/${topic.slug}`,
      structuredData: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: topic.name,
        description: topic.description,
        url: absoluteUrl(`/topics/${topic.slug}`),
        hasPart: detail.value.posts.map((post) => ({
          "@type": "BlogPosting",
          headline: post.title,
          url: absoluteUrl(`/posts/${post.slug}`)
        })),
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Topics", item: absoluteUrl("/topics") },
            { "@type": "ListItem", position: 3, name: topic.name, item: absoluteUrl(`/topics/${topic.slug}`) }
          ]
        }
      }
    });
  } catch {
    detail.value = null;
  }
});
</script>
