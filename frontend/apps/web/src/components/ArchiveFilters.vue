<template>
  <form class="archive-filters" @submit.prevent="submitSearch">
    <label for="archive-keyword">
      <span>Keyword</span>
      <input id="archive-keyword" v-model="draft.keyword" type="search" aria-label="Search title, summary, content" />
    </label>

    <label for="archive-year">
      <span>Year</span>
      <select id="archive-year" v-model="draft.year">
        <option value="">All years</option>
        <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
      </select>
    </label>

    <label v-if="taxonomyAvailable" for="archive-category">
      <span>Category</span>
      <select id="archive-category" v-model="draft.category">
        <option value="">All categories</option>
        <option v-for="category in categories" :key="category.id" :value="category.slug">{{ category.name }}</option>
      </select>
    </label>

    <label v-if="taxonomyAvailable" for="archive-tag">
      <span>Tag</span>
      <select id="archive-tag" v-model="draft.tag">
        <option value="">All tags</option>
        <option v-for="tag in tags" :key="tag.id" :value="tag.slug">#{{ tag.name }}</option>
      </select>
    </label>

    <label for="archive-sort">
      <span>Sort</span>
      <select id="archive-sort" v-model="draft.sort">
        <option value="publishedAt,desc">Newest</option>
        <option value="publishedAt,asc">Oldest</option>
        <option value="title,asc">Title A-Z</option>
        <option value="title,desc">Title Z-A</option>
      </select>
    </label>

    <div class="archive-filter-actions">
      <button type="submit">Search</button>
      <button data-test="archive-reset" type="button" @click="$emit('reset')">Reset</button>
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
