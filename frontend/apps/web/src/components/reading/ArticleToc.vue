<template>
  <nav v-if="items.length" class="article-toc" aria-label="Article table of contents">
    <h2>On this page</h2>
    <ol>
      <li v-for="item in items" :key="item.id">
        <a
          :href="`#${item.id}`"
          :class="[`toc-level-${item.level}`, { 'is-active': item.id === activeId }]"
          @click.prevent="$emit('navigate', item.id)"
        >
          {{ item.text }}
        </a>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import type { TocItem } from "../../features/reading/articleEnhancements";

defineProps<{
  items: TocItem[];
  activeId: string;
}>();

defineEmits<{
  navigate: [id: string];
}>();
</script>
