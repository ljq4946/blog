<template>
  <CrudPanel
    title="标签"
    :rows="rows"
    :fields="fields"
    :save-row="save"
    :delete-row="remove"
  />
</template>

<script setup lang="ts">
import type { Tag } from "@blog/shared";
import { onMounted, ref } from "vue";
import CrudPanel from "../components/CrudPanel.vue";
import { adminApi } from "../lib/api";

const rows = ref<Tag[]>([]);
const fields = [
  { key: "name", label: "名称" },
  { key: "slug", label: "URL 标识" }
];

async function load() {
  rows.value = await adminApi.tags();
}

async function save(row: Record<string, unknown>) {
  await adminApi.saveTag(row as Partial<Tag>);
  await load();
}

async function remove(id: number) {
  await adminApi.deleteTag(id);
  await load();
}

onMounted(load);
</script>
