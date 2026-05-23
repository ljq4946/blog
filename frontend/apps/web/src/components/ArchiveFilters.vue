<template>
  <form class="archive-filters" @submit.prevent="submitSearch">
    <label for="archive-keyword">
      <span>关键词</span>
      <input id="archive-keyword" v-model="draft.keyword" type="search" aria-label="搜索标题、摘要和正文" />
    </label>

    <label for="archive-year">
      <span>年份</span>
      <select id="archive-year" v-model="draft.year">
        <option value="">全部年份</option>
        <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
      </select>
    </label>

    <label v-if="taxonomyAvailable" for="archive-category">
      <span>分类</span>
      <select id="archive-category" v-model="draft.category">
        <option value="">全部分类</option>
        <option v-for="category in categories" :key="category.id" :value="category.slug">{{ category.name }}</option>
      </select>
    </label>

    <label v-if="taxonomyAvailable" for="archive-tag">
      <span>标签</span>
      <select id="archive-tag" v-model="draft.tag">
        <option value="">全部标签</option>
        <option v-for="tag in tags" :key="tag.id" :value="tag.slug">#{{ tag.name }}</option>
      </select>
    </label>

    <label for="archive-sort">
      <span>排序</span>
      <select id="archive-sort" v-model="draft.sort">
        <option value="publishedAt,desc">最新发布</option>
        <option value="publishedAt,asc">最早发布</option>
        <option value="title,asc">标题 A-Z</option>
        <option value="title,desc">标题 Z-A</option>
      </select>
    </label>

    <div class="archive-filter-actions">
      <button type="submit">搜索</button>
      <button data-test="archive-reset" type="button" @click="$emit('reset')">重置</button>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { Category, Tag } from "@blog/shared";
import { reactive, watch } from "vue";
import type { PostSearchParams } from "../lib/api";

type ArchiveFilterState = Required<Pick<PostSearchParams, "keyword" | "year" | "category" | "tag" | "sort">>;

const props = defineProps<{
  filters: ArchiveFilterState;
  years: string[];
  categories: Category[];
  tags: Tag[];
  taxonomyAvailable: boolean;
}>();

const emit = defineEmits<{
  search: [filters: ArchiveFilterState];
  reset: [];
}>();

const draft = reactive({ ...props.filters });

watch(
  () => props.filters,
  (nextFilters) => {
    Object.assign(draft, nextFilters);
  },
  { deep: true }
);

function submitSearch() {
  emit("search", { ...draft });
}
</script>
