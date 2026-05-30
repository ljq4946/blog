<template>
  <main class="content-band archive-discovery">
    <div class="section-head archive-discovery-head">
      <div>
        <h1>全部文章</h1>
        <p>按时间、主题或关键词浏览文章。</p>
      </div>
      <strong>{{ resultLabel }}</strong>
    </div>

    <ArchiveFilters
      :filters="filterState"
      :years="years"
      :categories="categories"
      :tags="tags"
      :topics="topics"
      :series="series"
      :taxonomy-available="taxonomyAvailable"
      @search="searchFromFilters"
      @reset="resetFilters"
    />

    <p v-if="loadError" class="archive-error">{{ loadError }}</p>

    <ArchivePostList :posts="pageData.content" @reset="resetFilters" />

    <PaginationControls
      :page="pageData.number"
      :total-pages="pageData.totalPages"
      @change="changePage"
    />
  </main>
</template>

<script setup lang="ts">
import type { Category, PageResponse, Post, Series, Tag, Topic } from "@blog/shared";
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import ArchiveFilters from "../components/ArchiveFilters.vue";
import ArchivePostList from "../components/ArchivePostList.vue";
import PaginationControls from "../components/PaginationControls.vue";
import { publicApi, type PostSearchParams } from "../lib/api";

const DEFAULT_SORT = "publishedAt,desc";
const PAGE_SIZE = 10;

type ArchiveFilterState = {
  keyword: string;
  year: string;
  category: string;
  tag: string;
  topic: string;
  series: string;
  sort: string;
};
type ArchiveFilterInput = Required<Pick<PostSearchParams, "keyword" | "year" | "category" | "tag" | "topic" | "series" | "sort">>;

const route = useRoute();
const router = useRouter();
const categories = ref<Category[]>([]);
const tags = ref<Tag[]>([]);
const topics = ref<Topic[]>([]);
const series = ref<Series[]>([]);
const taxonomyAvailable = ref(true);
const loadError = ref("");
const pageData = ref<PageResponse<Post>>({
  content: [],
  number: 0,
  size: PAGE_SIZE,
  totalElements: 0,
  totalPages: 0
});

const filterState = reactive<ArchiveFilterState>({
  keyword: queryString(route.query.keyword),
  year: queryString(route.query.year),
  category: queryString(route.query.category),
  tag: queryString(route.query.tag),
  topic: queryString(route.query.topic),
  series: queryString(route.query.series),
  sort: queryString(route.query.sort) || DEFAULT_SORT
});

const years = computed(() => {
  const fromResults = pageData.value.content
    .map((post) => post.publishedAt?.slice(0, 4))
    .filter((year): year is string => Boolean(year));
  const selectedYear = filterState.year ? [filterState.year] : [];
  return Array.from(new Set([...fromResults, ...selectedYear])).sort((left, right) => right.localeCompare(left));
});

const resultLabel = computed(() => {
  const total = pageData.value.totalElements;
  return `${total} 篇文章`;
});

function queryString(value: unknown) {
  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
}

function queryPage(value: unknown) {
  const parsed = Number(queryString(value));
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

function normalizeFilterState(filters: ArchiveFilterInput): ArchiveFilterState {
  return {
    keyword: queryString(filters.keyword).trim(),
    year: queryString(filters.year).trim(),
    category: queryString(filters.category).trim(),
    tag: queryString(filters.tag).trim(),
    topic: queryString(filters.topic).trim(),
    series: queryString(filters.series).trim(),
    sort: queryString(filters.sort).trim() || DEFAULT_SORT
  };
}

function activeParams(page = queryPage(route.query.page)): PostSearchParams {
  const filters = normalizeFilterState(filterState);
  const params: PostSearchParams = {
    page,
    size: PAGE_SIZE,
    sort: filters.sort
  };
  if (filters.keyword) {
    params.keyword = filters.keyword;
  }
  if (filters.year) {
    params.year = filters.year;
  }
  if (filters.category) {
    params.category = filters.category;
  }
  if (filters.tag) {
    params.tag = filters.tag;
  }
  if (filters.topic) {
    params.topic = filters.topic;
  }
  if (filters.series) {
    params.series = filters.series;
  }
  return params;
}

function cleanQuery(params: PostSearchParams) {
  const query: Record<string, string> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    if (typeof value === "string") {
      const text = value.trim();
      if (!text) {
        return;
      }
      query[key] = text;
      return;
    }
    query[key] = String(value);
  });
  return query;
}

async function loadPosts(params: PostSearchParams) {
  loadError.value = "";
  try {
    pageData.value = await publicApi.searchPosts(params);
  } catch {
    loadError.value = "文章列表暂时无法加载，请稍后再试。";
    pageData.value = { content: [], number: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 0 };
  }
}

async function loadTaxonomy() {
  try {
    const [loadedCategories, loadedTags, loadedTopics, loadedSeries] = await Promise.all([
      publicApi.categories(),
      publicApi.tags(),
      publicApi.topics(),
      publicApi.seriesList()
    ]);
    categories.value = loadedCategories;
    tags.value = loadedTags;
    topics.value = loadedTopics;
    series.value = loadedSeries;
    taxonomyAvailable.value = true;
  } catch {
    categories.value = [];
    tags.value = [];
    topics.value = [];
    series.value = [];
    taxonomyAvailable.value = false;
  }
}

async function searchFromFilters(nextFilters: ArchiveFilterInput) {
  Object.assign(filterState, normalizeFilterState(nextFilters));
  const params = activeParams(0);
  await router.replace({ query: cleanQuery(params) });
  await loadPosts(params);
}

async function resetFilters() {
  Object.assign(filterState, { keyword: "", year: "", category: "", tag: "", topic: "", series: "", sort: DEFAULT_SORT });
  await router.replace({ query: {} });
  await loadPosts({ page: 0, size: PAGE_SIZE, sort: DEFAULT_SORT });
}

async function changePage(page: number) {
  const params = activeParams(page);
  await router.replace({ query: cleanQuery(params) });
  await loadPosts(params);
}

onMounted(async () => {
  await Promise.all([
    loadTaxonomy(),
    loadPosts(activeParams())
  ]);
});
</script>
