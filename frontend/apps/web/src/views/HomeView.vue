<template>
  <main class="home-page">
    <section
      ref="posterRef"
      class="home-poster"
      :style="{ '--poster-scroll': posterScroll.toFixed(3) }"
      aria-labelledby="home-poster-title"
    >
      <div class="poster-cells" aria-hidden="true">
        <span class="poster-cell poster-cell--paper"></span>
        <span class="poster-cell poster-cell--yellow"></span>
        <span class="poster-cell poster-cell--paper"></span>
        <span class="poster-cell poster-cell--blue"></span>
        <span class="poster-cell poster-cell--paper"></span>
        <span class="poster-cell poster-cell--red"></span>
      </div>
      <div class="poster-stage">
        <div class="poster-copy">
          <p class="kicker poster-kicker">Public notebook / Index 4946</p>
          <h1 id="home-poster-title">4946个人站</h1>
          <p class="poster-tagline">In solitude, where we are least alone</p>
        </div>
        <div class="poster-index" aria-label="站点索引">
          <span>WRITING</span>
          <span>NOTES</span>
          <span>ARCHIVE</span>
        </div>
        <div class="poster-strike" aria-hidden="true">
          <span class="poster-circle"></span>
          <span class="poster-wedge poster-wedge-main"></span>
        </div>
        <span class="poster-wedge poster-wedge-small" aria-hidden="true"></span>
        <span class="poster-rule poster-rule-blue" aria-hidden="true"></span>
        <span class="poster-rule poster-rule-yellow" aria-hidden="true"></span>
      </div>
    </section>
    <section class="content-band home-interlude" data-test="home-interlude" aria-label="站主动态">
      <article class="interlude-module home-about-module" data-test="home-about-module">
        <div class="module-kicker">{{ homeProfile.aboutKicker }}</div>
        <h2>{{ homeProfile.aboutTitle }}</h2>
        <p>
          {{ homeProfile.aboutBody }}
        </p>
        <ul class="about-signals" aria-label="当前关注">
          <li v-for="item in homeProfile.focusItems" :key="`${item.label}:${item.text}`">
            <span>{{ item.label }}</span>
            <strong>{{ item.text }}</strong>
          </li>
        </ul>
      </article>
      <article
        class="interlude-module home-music-module"
        :class="{ 'is-playing': isMusicPlaying }"
        data-test="home-music-module"
      >
        <div class="module-kicker">Now listening / {{ listeningTime }}</div>
        <div class="music-layout">
          <div class="music-disc" aria-hidden="true">
            <span></span>
          </div>
          <div class="music-copy">
            <h2>{{ homeProfile.musicTitle }}</h2>
            <p>{{ homeProfile.musicSubtitle }}</p>
            <p class="music-meta">{{ homeProfile.musicMeta }}</p>
          </div>
        </div>
        <audio
          v-if="homeProfile.musicAudioUrl"
          ref="audioRef"
          data-test="home-music-audio"
          :src="homeProfile.musicAudioUrl"
          preload="metadata"
          @durationchange="syncMusicProgressFromAudio"
          @ended="handleMusicEnded"
          @loadedmetadata="syncMusicProgressFromAudio"
          @timeupdate="syncMusicProgressFromAudio"
        ></audio>
        <div class="music-controls">
          <button
            type="button"
            class="music-toggle"
            :aria-pressed="isMusicPlaying"
            data-test="home-music-toggle"
            @click="toggleMusic"
          >
            <span aria-hidden="true">{{ isMusicPlaying ? "Ⅱ" : "▶" }}</span>
            {{ isMusicPlaying ? "暂停" : "播放" }}
          </button>
          <div
            class="music-progress"
            data-test="home-music-progress"
            role="progressbar"
            aria-label="播放进度"
            :aria-valuenow="musicProgress"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <span :style="{ width: `${musicProgress}%` }"></span>
          </div>
        </div>
      </article>
    </section>
    <section class="content-band latest-posts">
      <div class="section-head">
        <h2>最新文章</h2>
      </div>
      <div v-if="posts.length" class="post-grid">
        <PostCard v-for="post in posts.slice(0, 3)" :key="post.id" :post="post" />
      </div>
      <EmptyState v-else title="暂无已发布文章" />
    </section>
  </main>
</template>

<script setup lang="ts">
import type { HomeProfile, Post } from "@blog/shared";
import { onBeforeUnmount, onMounted, ref } from "vue";
import EmptyState from "../components/EmptyState.vue";
import PostCard from "../components/PostCard.vue";
import { publicApi } from "../lib/api";

const defaultHomeProfile: HomeProfile = {
  key: "home",
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
  ],
  updatedAt: ""
};

const posts = ref<Post[]>([]);
const homeProfile = ref<HomeProfile>({ ...defaultHomeProfile, focusItems: [...defaultHomeProfile.focusItems] });
const audioRef = ref<HTMLAudioElement | null>(null);
const posterRef = ref<HTMLElement | null>(null);
const posterScroll = ref(0);
const isMusicPlaying = ref(false);
const listeningTime = ref(formatListeningTime(new Date()));
const musicProgress = ref(0);
let listeningClockId: number | undefined;
let demoProgressClockId: number | undefined;
let demoProgressSeconds = 0;

const demoTrackSeconds = 60;

function formatListeningTime(date: Date) {
  const hours = date.getHours();
  const displayHours = hours % 12 || 12;
  const suffix = hours >= 12 ? "PM" : "AM";

  return `${displayHours.toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")} ${suffix}`;
}

function updateListeningTime() {
  listeningTime.value = formatListeningTime(new Date());
}

function setMusicProgress(value: number) {
  musicProgress.value = Math.min(100, Math.max(0, Math.round(value)));
}

function syncMusicProgressFromAudio() {
  const audio = audioRef.value;
  if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) {
    setMusicProgress(0);
    return;
  }

  setMusicProgress((audio.currentTime / audio.duration) * 100);
}

function handleMusicEnded() {
  stopDemoProgress();
  syncMusicProgressFromAudio();
  isMusicPlaying.value = false;
}

function startDemoProgress() {
  stopDemoProgress();
  demoProgressClockId = window.setInterval(() => {
    demoProgressSeconds = (demoProgressSeconds + 1) % demoTrackSeconds;
    setMusicProgress((demoProgressSeconds / demoTrackSeconds) * 100);
  }, 1_000);
}

function stopDemoProgress() {
  if (demoProgressClockId === undefined) {
    return;
  }

  window.clearInterval(demoProgressClockId);
  demoProgressClockId = undefined;
}

function toggleMusic() {
  const audio = audioRef.value;
  if (!audio) {
    isMusicPlaying.value = !isMusicPlaying.value;
    if (isMusicPlaying.value) {
      startDemoProgress();
      return;
    }
    stopDemoProgress();
    return;
  }
  if (isMusicPlaying.value) {
    audio.pause();
    stopDemoProgress();
    syncMusicProgressFromAudio();
    isMusicPlaying.value = false;
    return;
  }
  isMusicPlaying.value = true;
  startDemoProgress();
  audio.play()
    .then(() => {
      stopDemoProgress();
      syncMusicProgressFromAudio();
    })
    .catch(() => {
      startDemoProgress();
    });
}

function fallbackHomeProfile() {
  return { ...defaultHomeProfile, focusItems: [...defaultHomeProfile.focusItems] };
}

function updatePosterScroll() {
  const poster = posterRef.value;
  if (!poster) {
    posterScroll.value = 0;
    return;
  }

  const rect = poster.getBoundingClientRect();
  const distance = Math.min(Math.max(-rect.top, 0), Math.max(rect.height, 1));
  posterScroll.value = distance / Math.max(rect.height, 1);
}

onMounted(async () => {
  updatePosterScroll();
  updateListeningTime();
  listeningClockId = window.setInterval(updateListeningTime, 60_000);
  window.addEventListener("scroll", updatePosterScroll, { passive: true });
  const [loadedPosts, loadedProfile] = await Promise.allSettled([
    publicApi.posts(),
    publicApi.homeProfile()
  ]);
  posts.value = loadedPosts.status === "fulfilled" ? loadedPosts.value : [];
  homeProfile.value = loadedProfile.status === "fulfilled" && loadedProfile.value
    ? loadedProfile.value
    : fallbackHomeProfile();
});

onBeforeUnmount(() => {
  if (listeningClockId !== undefined) {
    window.clearInterval(listeningClockId);
  }
  stopDemoProgress();
  window.removeEventListener("scroll", updatePosterScroll);
});
</script>
