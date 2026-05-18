<template>
  <section class="panel">
    <div class="page-head">
      <h1>{{ title }}</h1>
      <el-button type="danger" @click="open({})">新建</el-button>
    </div>
    <el-alert v-if="error" type="error" :title="error" :closable="false" />
    <el-table :data="rows" border>
      <el-table-column v-for="field in fields" :key="field.key" :prop="field.key" :label="field.label" />
      <el-table-column label="操作" width="170">
        <template #default="{ row }">
          <el-button size="small" @click="open(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="remove(Number(row.id))">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="visible" :title="title" width="520">
      <el-form label-position="top">
        <el-form-item v-for="field in fields" :key="field.key" :label="field.label">
          <el-input v-model="draft[field.key]" />
        </el-form-item>
        <el-alert v-if="dialogError" type="error" :title="dialogError" :closable="false" />
        <el-button type="danger" :loading="saving" @click="submit">保存</el-button>
      </el-form>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";

const props = defineProps<{
  title: string;
  rows: Array<Record<string, unknown>>;
  fields: Array<{ key: string; label: string }>;
  saveRow: (row: Record<string, unknown>) => Promise<void> | void;
  deleteRow: (id: number) => Promise<void> | void;
}>();

const visible = ref(false);
const saving = ref(false);
const error = ref("");
const dialogError = ref("");
const draft = reactive<Record<string, unknown>>({});

function open(row: Record<string, unknown>) {
  Object.keys(draft).forEach((key) => delete draft[key]);
  Object.assign(draft, row);
  dialogError.value = "";
  error.value = "";
  visible.value = true;
}

async function submit() {
  dialogError.value = "";
  saving.value = true;
  try {
    await props.saveRow({ ...draft });
    visible.value = false;
  } catch (err) {
    dialogError.value = errorMessage(err);
  } finally {
    saving.value = false;
  }
}

async function remove(id: number) {
  error.value = "";
  try {
    await props.deleteRow(id);
  } catch (err) {
    error.value = errorMessage(err);
  }
}

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "操作失败，请稍后重试";
}
</script>
