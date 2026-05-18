<template>
  <section class="panel">
    <div class="page-head">
      <h1>媒体</h1>
      <input type="file" @change="upload" />
    </div>
    <div class="media-grid">
      <article v-for="asset in media" :key="asset.id" class="media-tile">
        <strong>{{ asset.originalName }}</strong>
        <p>{{ asset.mimeType }} / {{ Math.ceil(asset.size / 1024) }} KB</p>
        <a :href="asset.url" target="_blank" rel="noreferrer">{{ asset.url }}</a>
        <el-button size="small" type="danger" @click="remove(asset.id)">删除</el-button>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { MediaAsset } from "@blog/shared";
import { onMounted, ref } from "vue";
import { adminApi } from "../lib/api";

const media = ref<MediaAsset[]>([]);

async function load() {
  media.value = (await adminApi.media()).content;
}

async function upload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    await adminApi.uploadMedia(file);
    await load();
  }
}

async function remove(id: number) {
  await adminApi.deleteMedia(id);
  await load();
}

onMounted(load);
</script>
