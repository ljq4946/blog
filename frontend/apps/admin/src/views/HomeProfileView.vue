<template>
  <section class="panel home-profile-admin">
    <div class="page-head">
      <div>
        <h1>首页</h1>
        <p>编辑首屏下方的音乐播放与个人介绍模块。</p>
      </div>
      <el-button data-test="save-home-profile" type="danger" :loading="saving" @click="save">
        保存
      </el-button>
    </div>

    <el-alert v-if="error" type="error" :title="error" :closable="false" />
    <el-alert v-if="saveStatus" type="success" :title="saveStatus" :closable="false" />

    <el-form label-position="top" class="home-profile-grid">
      <article class="home-profile-section">
        <div class="home-profile-section-head">
          <span>Music</span>
          <h2>音乐播放</h2>
        </div>
        <el-form-item label="标题">
          <el-input v-model="form.musicTitle" data-test="music-title" />
        </el-form-item>
        <el-form-item label="副标题">
          <el-input v-model="form.musicSubtitle" data-test="music-subtitle" />
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="form.musicMeta" data-test="music-meta" />
        </el-form-item>
        <el-form-item label="音频 URL">
          <el-input v-model="form.musicAudioUrl" data-test="music-audio-url" placeholder="/uploads/focus.mp3" />
        </el-form-item>
      </article>

      <article class="home-profile-section">
        <div class="home-profile-section-head">
          <span>About</span>
          <h2>个人介绍</h2>
        </div>
        <el-form-item label="眉标">
          <el-input v-model="form.aboutKicker" data-test="about-kicker" />
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="form.aboutTitle" data-test="about-title" />
        </el-form-item>
        <el-form-item label="正文">
          <el-input v-model="form.aboutBody" data-test="about-body" type="textarea" :rows="5" />
        </el-form-item>
      </article>

      <article class="home-profile-section home-profile-section--wide">
        <div class="home-profile-section-head">
          <span>Signals</span>
          <h2>当前关注</h2>
        </div>
        <div class="focus-editor">
          <div v-for="(item, index) in form.focusItems" :key="index" class="focus-row">
            <el-form-item label="标签">
              <el-input v-model="item.label" :data-test="`focus-${index}-label`" />
            </el-form-item>
            <el-form-item label="内容">
              <el-input v-model="item.text" :data-test="`focus-${index}-text`" />
            </el-form-item>
          </div>
        </div>
      </article>
    </el-form>
  </section>
</template>

<script setup lang="ts">
import type { HomeProfile, HomeProfileInput } from "@blog/shared";
import { onMounted, reactive, ref } from "vue";
import { adminApi } from "../lib/api";

const defaultForm: HomeProfileInput = {
  musicTitle: "私人电台",
  musicSubtitle: "深夜写作清单",
  musicMeta: "lo-fi / city rain / quiet loop",
  musicAudioUrl: "",
  aboutKicker: "About / 4946",
  aboutTitle: "我是 4946",
  aboutBody: "这里像一本公开笔记：记录技术实战、写作训练和日常观察，也保留问题被解决前后的纹理。",
  focusItems: [
    { label: "正在写", text: "设计模式与工程经验" },
    { label: "正在读", text: "代码、散文与城市噪声" },
    { label: "正在收集", text: "可复用的问题清单" }
  ]
};

const form = reactive<HomeProfileInput>(cloneInput(defaultForm));
const saving = ref(false);
const error = ref("");
const saveStatus = ref("");

function cloneInput(input: HomeProfileInput): HomeProfileInput {
  return {
    ...input,
    focusItems: input.focusItems.map((item) => ({ ...item }))
  };
}

function assignProfile(profile: HomeProfile | HomeProfileInput) {
  const next = cloneInput({
    musicTitle: profile.musicTitle,
    musicSubtitle: profile.musicSubtitle,
    musicMeta: profile.musicMeta,
    musicAudioUrl: profile.musicAudioUrl,
    aboutKicker: profile.aboutKicker,
    aboutTitle: profile.aboutTitle,
    aboutBody: profile.aboutBody,
    focusItems: profile.focusItems.length ? profile.focusItems.slice(0, 3) : defaultForm.focusItems
  });
  while (next.focusItems.length < 3) {
    next.focusItems.push({ ...defaultForm.focusItems[next.focusItems.length] });
  }
  Object.assign(form, next);
}

function payload(): HomeProfileInput {
  return cloneInput(form);
}

async function load() {
  error.value = "";
  try {
    assignProfile(await adminApi.homeProfile());
  } catch (err) {
    error.value = err instanceof Error ? err.message : "首页配置加载失败";
  }
}

async function save() {
  saving.value = true;
  error.value = "";
  saveStatus.value = "";
  try {
    await adminApi.saveHomeProfile(payload());
    saveStatus.value = "已保存";
  } catch (err) {
    error.value = err instanceof Error ? err.message : "首页配置保存失败";
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.home-profile-admin {
  display: grid;
  gap: 16px;
}

.page-head p {
  font-weight: 800;
  margin: 8px 0 0;
}

.home-profile-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.home-profile-section {
  background: var(--paper-soft);
  border: 2px solid var(--ink);
  padding: 16px;
}

.home-profile-section--wide {
  grid-column: 1 / -1;
}

.home-profile-section-head {
  border-bottom: 2px solid var(--ink);
  margin-bottom: 16px;
  padding-bottom: 10px;
}

.home-profile-section-head span {
  background: var(--yellow);
  border: 2px solid var(--ink);
  display: inline-flex;
  font-family: "IBM Plex Mono", "Consolas", monospace;
  font-size: 12px;
  font-weight: 900;
  padding: 4px 7px;
  text-transform: uppercase;
}

.home-profile-section-head h2 {
  font-family: "Archivo Black", "Arial Black", sans-serif;
  font-size: 28px;
  line-height: 1;
  margin: 10px 0 0;
}

.focus-editor {
  display: grid;
  gap: 10px;
}

.focus-row {
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(120px, 0.3fr) minmax(0, 1fr);
}

@media (max-width: 760px) {
  .home-profile-grid,
  .focus-row {
    grid-template-columns: 1fr;
  }
}
</style>
