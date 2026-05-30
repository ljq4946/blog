<template>
  <section class="panel">
    <div class="page-head">
      <h1>系列</h1>
      <el-button type="danger" @click="open({})">新建</el-button>
    </div>

    <el-alert v-if="error" type="error" :title="error" :closable="false" />

    <el-table :data="rows" border>
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="slug" label="URL 标识" />
      <el-table-column label="主专题">
        <template #default="{ row }">{{ row.primaryTopic?.name ?? "未关联" }}</template>
      </el-table-column>
      <el-table-column prop="sortOrder" label="排序" width="90" />
      <el-table-column label="操作" width="170">
        <template #default="{ row }">
          <el-button size="small" @click="open(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="remove(Number(row.id))">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" title="系列" width="560">
      <el-form label-position="top">
        <el-form-item label="名称">
          <el-input v-model="draft.name" />
        </el-form-item>
        <el-form-item label="URL 标识">
          <el-input v-model="draft.slug" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="draft.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="主专题">
          <el-select v-model="draft.primaryTopicId" clearable>
            <el-option v-for="topic in topics" :key="topic.id" :label="topic.name" :value="topic.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input v-model="draft.sortOrder" />
        </el-form-item>
        <el-alert v-if="dialogError" type="error" :title="dialogError" :closable="false" />
        <el-button type="danger" :loading="saving" @click="submit">保存</el-button>
      </el-form>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import type { Series, SeriesInput, Topic } from "@blog/shared";
import { onMounted, reactive, ref } from "vue";
import { adminApi } from "../lib/api";

const rows = ref<Series[]>([]);
const topics = ref<Topic[]>([]);
const visible = ref(false);
const saving = ref(false);
const error = ref("");
const dialogError = ref("");
const draft = reactive<Record<string, unknown>>({});

async function load() {
  const [loadedSeries, loadedTopics] = await Promise.all([adminApi.series(), adminApi.topics()]);
  rows.value = loadedSeries;
  topics.value = loadedTopics;
}

function open(row: Partial<Series>) {
  Object.keys(draft).forEach((key) => delete draft[key]);
  Object.assign(draft, row, { primaryTopicId: row.primaryTopic?.id ?? null });
  visible.value = true;
  error.value = "";
  dialogError.value = "";
}

async function submit() {
  dialogError.value = "";
  saving.value = true;
  try {
    const sortOrder = Number(draft.sortOrder);
    await adminApi.saveSeries({
      ...draft,
      primaryTopicId: draft.primaryTopicId === "" ? null : draft.primaryTopicId,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0
    } as Partial<SeriesInput> & { id?: number });
    visible.value = false;
    await load();
  } catch (err) {
    dialogError.value = err instanceof Error ? err.message : "保存失败，请稍后重试";
  } finally {
    saving.value = false;
  }
}

async function remove(id: number) {
  error.value = "";
  try {
    await adminApi.deleteSeries(id);
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "删除失败，请先检查是否有关联文章";
  }
}

onMounted(load);
</script>
