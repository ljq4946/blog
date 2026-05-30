<template>
  <CrudPanel
    title="专题"
    :rows="rows"
    :fields="fields"
    :save-row="save"
    :delete-row="remove"
  />
</template>

<script setup lang="ts">
import type { Topic, TopicInput } from "@blog/shared";
import { onMounted, ref } from "vue";
import CrudPanel from "../components/CrudPanel.vue";
import { adminApi } from "../lib/api";

const rows = ref<Topic[]>([]);
const fields = [
  { key: "name", label: "名称" },
  { key: "slug", label: "URL 标识" },
  { key: "description", label: "描述" },
  { key: "sortOrder", label: "排序" }
];

async function load() {
  rows.value = await adminApi.topics();
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
