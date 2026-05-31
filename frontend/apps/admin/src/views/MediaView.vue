<template>
  <section class="panel">
    <div class="page-head">
      <h1>媒体</h1>
      <input type="file" @change="upload" />
    </div>
    <div class="media-tools">
      <select data-test="media-type-filter" v-model="typeFilter">
        <option value="all">全部</option>
        <option value="image">图片</option>
        <option value="audio">音频</option>
        <option value="video">视频</option>
        <option value="document">文档</option>
      </select>
    </div>
    <el-alert v-if="referenceMessage" type="warning" :title="referenceMessage" :closable="false" />
    <div class="media-grid">
      <article v-for="asset in filteredMedia" :key="asset.id" class="media-tile">
        <img v-if="asset.mimeType.startsWith('image/')" class="media-preview" :src="asset.url" :alt="asset.originalName" />
        <div v-else class="media-preview media-preview--file">{{ mediaKind(asset.mimeType) }}</div>
        <strong>{{ asset.originalName }}</strong>
        <p>{{ asset.mimeType }} / {{ Math.ceil(asset.size / 1024) }} KB</p>
        <a :href="asset.url" target="_blank" rel="noreferrer">{{ asset.url }}</a>
        <div class="media-actions">
          <el-button :data-test="`copy-media-${asset.id}`" size="small" @click="copyUrl(asset.url)">复制 URL</el-button>
          <el-button :data-test="`delete-media-${asset.id}`" size="small" type="danger" @click="remove(asset.id)">删除</el-button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { MediaAsset } from "@blog/shared";
import { computed, onMounted, ref } from "vue";
import { adminApi } from "../lib/api";

const media = ref<MediaAsset[]>([]);
const typeFilter = ref("all");
const referenceMessage = ref("");

const filteredMedia = computed(() => media.value.filter((asset) => {
  if (typeFilter.value === "all") {
    return true;
  }
  if (typeFilter.value === "document") {
    return !asset.mimeType.startsWith("image/") && !asset.mimeType.startsWith("audio/") && !asset.mimeType.startsWith("video/");
  }
  return asset.mimeType.startsWith(`${typeFilter.value}/`);
}));

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
  referenceMessage.value = "";
  const references = await adminApi.mediaReferences(id);
  if (references.count > 0) {
    referenceMessage.value = `该媒体仍被 ${references.count} 篇文章引用：${references.posts.map((post) => post.title).join("、")}`;
    if (!window.confirm(referenceMessage.value)) {
      return;
    }
  }
  await adminApi.deleteMedia(id);
  await load();
}

async function copyUrl(url: string) {
  await navigator.clipboard?.writeText(url);
}

function mediaKind(mimeType: string) {
  if (mimeType.startsWith("audio/")) {
    return "AUDIO";
  }
  if (mimeType.startsWith("video/")) {
    return "VIDEO";
  }
  return "FILE";
}

onMounted(load);
</script>

<style scoped>
.media-tools {
  margin-bottom: 14px;
}

.media-tools select {
  background: var(--paper);
  border: 2px solid var(--ink);
  color: var(--ink);
  font: inherit;
  font-weight: 800;
  min-height: 38px;
  padding: 6px 10px;
}

.media-tile {
  display: grid;
  gap: 8px;
}

.media-preview {
  aspect-ratio: 4 / 3;
  border: 2px solid var(--ink);
  object-fit: cover;
  width: 100%;
}

.media-preview--file {
  align-items: center;
  background: var(--paper-soft);
  color: var(--blue);
  display: grid;
  font-family: "Archivo Black", "Arial Black", sans-serif;
  font-size: 22px;
  place-items: center;
}

.media-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.media-actions .el-button {
  margin-left: 0;
}
</style>
