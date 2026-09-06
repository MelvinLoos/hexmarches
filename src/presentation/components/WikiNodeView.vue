<template>
  <div class="wiki-node-view">
    <div v-if="node.coverImageUrl" class="cover-hero" data-testid="wiki-cover-hero">
      <img :src="node.coverImageUrl" :alt="node.title + ' cover'" class="cover-image" />
    </div>
    <h2>{{ node.title }}</h2>
    <div class="wiki-content" v-html="node.content" />
  </div>
</template>

<script setup lang="ts">
import type { WikiNode } from '~/src/core/domain/wiki-node'

defineProps<{
  node: WikiNode
}>()
</script>

<style scoped>
.wiki-node-view {
  color: #e0e0e0;
}
.cover-hero {
  margin: -16px -16px 16px -16px;
  overflow: hidden;
  border-radius: 8px 8px 0 0;
  max-height: 300px;
}
.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
h2 {
  color: #e94560;
  margin-bottom: 16px;
}
.wiki-content {
  line-height: 1.6;
}
</style>