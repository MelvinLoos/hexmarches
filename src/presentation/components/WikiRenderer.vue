<template>
  <div class="wiki-renderer">
    <MDC :value="content" tag="div" />
  </div>
</template>

<script setup lang="ts">
import { MDC } from '@nuxtjs/mdc'

defineProps<{
  content: string
}>()
</script>

<style scoped>
.wiki-renderer {
  padding: 16px;
  color: #e0e0e0;
  line-height: 1.6;
}
.wiki-renderer :deep(h1),
.wiki-renderer :deep(h2),
.wiki-renderer :deep(h3) {
  color: #e94560;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}
.wiki-renderer :deep(p) {
  margin-bottom: 1em;
}
.wiki-renderer :deep(strong) {
  color: #fff;
}
</style>