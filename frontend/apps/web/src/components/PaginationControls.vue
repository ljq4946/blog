<template>
  <nav class="pagination-controls" aria-label="Article pagination">
    <button data-test="previous-page" type="button" :disabled="page <= 0" @click="$emit('change', page - 1)">上一页</button>
    <span>第 {{ displayPage }} / {{ displayTotal }} 页</span>
    <button data-test="next-page" type="button" :disabled="page >= totalPages - 1 || totalPages <= 1" @click="$emit('change', page + 1)">下一页</button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  page: number;
  totalPages: number;
}>();

defineEmits<{
  change: [page: number];
}>();

const displayPage = computed(() => Math.min(props.page + 1, Math.max(props.totalPages, 1)));
const displayTotal = computed(() => Math.max(props.totalPages, 1));
</script>
