<template>
  <div class="wiki-node-view">
    <h2>{{ node.title }}</h2>
    <div class="wiki-content" v-html="node.content" />
  </div>
</template>

<script setup lang="ts">
import type { WikiNode } from '../types/wiki'

defineProps<{
  node: WikiNode
}>()
</script>