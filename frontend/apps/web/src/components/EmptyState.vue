<template>
  <div class="empty-state">
    <strong>{{ title }}</strong>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string }>();
</script>
