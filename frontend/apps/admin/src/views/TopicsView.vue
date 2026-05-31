<template>
  <section>
    <section v-if="coverage.length" class="panel topic-coverage">
      <div class="section-head">
        <h2>专题覆盖</h2>
        <span>{{ emptyCount }} 个空专题</span>
      </div>
      <ol>
        <li v-for="item in coverage" :key="item.id">
          <strong>{{ item.name }}</strong>
          <span>{{ item.postCount }} 篇文章</span>
          <em v-if="item.empty">空专题</em>
          <time v-else>{{ formatDate(item.latestPostUpdatedAt) }}</time>
        </li>
      </ol>
    </section>
    <CrudPanel
      title="专题"
      :rows="rows"
      :fields="fields"
      :save-row="save"
      :delete-row="remove"
    />
  </section>
</template>

<script setup lang="ts">
import { formatDate, type ContentGovernance, type Topic, type TopicCoverage, type TopicInput } from "@blog/shared";
import { computed, onMounted, ref } from "vue";
import CrudPanel from "../components/CrudPanel.vue";
import { adminApi } from "../lib/api";

const rows = ref<Topic[]>([]);
const governance = ref<ContentGovernance | null>(null);
const fields = [
  { key: "name", label: "名称" },
  { key: "slug", label: "URL 标识" },
  { key: "description", label: "描述" },
  { key: "sortOrder", label: "排序" }
];
const coverage = computed<TopicCoverage[]>(() => governance.value?.topicCoverage ?? []);
const emptyCount = computed(() => coverage.value.filter((item) => item.empty).length);

async function load() {
  const [loadedTopics, snapshot] = await Promise.all([
    adminApi.topics(),
    adminApi.contentGovernance().catch(() => null)
  ]);
  rows.value = loadedTopics;
  governance.value = snapshot;
}

async function save(row: Record<string, unknown>) {
  const sortOrder = Number(row.sortOrder);
  await adminApi.saveTopic({
    ...row,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0
  } as Partial<TopicInput> & { id?: number });
  await load();
}

async function remove(id: number) {
  await adminApi.deleteTopic(id);
  await load();
}

onMounted(load);
</script>

<style scoped>
.topic-coverage {
  margin-bottom: 18px;
}

.section-head {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-head h2 {
  font-family: "Archivo Black", "Arial Black", sans-serif;
  margin: 0;
}

.section-head span {
  background: var(--yellow);
  border: 2px solid var(--ink);
  font-weight: 900;
  padding: 4px 8px;
}

.topic-coverage ol {
  display: grid;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.topic-coverage li {
  align-items: center;
  border: 2px solid var(--ink);
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(160px, 1fr) 100px minmax(120px, 1fr);
  padding: 8px;
}

.topic-coverage time {
  color: var(--blue);
  font-family: "IBM Plex Mono", "Consolas", monospace;
  font-size: 12px;
  font-weight: 800;
}

.topic-coverage em {
  background: var(--paper-soft);
  border: 2px solid var(--ink);
  font-style: normal;
  font-weight: 900;
  padding: 3px 6px;
}

@media (max-width: 760px) {
  .topic-coverage li {
    grid-template-columns: 1fr;
  }
}
</style>
