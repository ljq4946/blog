<template>
  <button class="reading-preferences" type="button" @click="toggleTheme">
    {{ theme === "dark" ? "Light mode" : "Dark mode" }}
  </button>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import {
  readStoredTheme,
  writeStoredTheme,
  type ReadingTheme
} from "../../features/reading/articleEnhancements";

const theme = ref<ReadingTheme>(readStoredTheme());

function applyTheme(nextTheme: ReadingTheme) {
  document.documentElement.dataset.theme = nextTheme;
}

function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark";
}

onMounted(() => {
  applyTheme(theme.value);
});

watch(theme, (nextTheme) => {
  applyTheme(nextTheme);
  writeStoredTheme(nextTheme);
});
</script>
