<template>
  <MermaidRenderer v-if="isMermaid" :code="code" />
  <pre v-else :class="$props.class"><slot /></pre>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MermaidRenderer from './MermaidRenderer.client.vue'

const props = defineProps({
  code: {
    type: String,
    default: '',
  },
  language: {
    type: String,
    default: null,
  },
  filename: {
    type: String,
    default: null,
  },
  highlights: {
    type: Array as () => number[],
    default: () => [],
  },
  meta: {
    type: String,
    default: null,
  },
  class: {
    type: String,
    default: null,
  },
})

const isMermaid = computed(() => {
  return props.language?.toLowerCase() === 'mermaid'
})
</script>

<style>
pre code .line{display:block}
</style>