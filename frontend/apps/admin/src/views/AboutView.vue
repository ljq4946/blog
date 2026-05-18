<template>
  <section class="panel">
    <div class="page-head">
      <h1>关于</h1>
      <el-button type="danger" @click="save">保存</el-button>
    </div>
    <el-form label-position="top">
      <el-form-item label="标题">
        <el-input v-model="title" />
      </el-form-item>
      <el-form-item label="HTML 内容">
        <el-input v-model="contentHtml" type="textarea" :rows="14" />
      </el-form-item>
    </el-form>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { adminApi } from "../lib/api";

const title = ref("关于");
const contentHtml = ref("");

onMounted(async () => {
  const page = await adminApi.about();
  title.value = page.title;
  contentHtml.value = page.contentHtml;
});

async function save() {
  await adminApi.saveAbout({ title: title.value, contentHtml: contentHtml.value });
}
</script>
