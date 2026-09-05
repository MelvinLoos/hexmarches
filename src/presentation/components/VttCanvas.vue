<template>
  <div class="vtt-canvas">
    <div class="hex-grid-info">
      Grid: {{ gridWidth }}×{{ gridHeight }} | Hex Radius: {{ hexRadius }}px
    </div>
    <div class="canvas-placeholder">
      <!-- vue-konva stage rendered here in full implementation -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  hexRadius?: number
  gridWidth?: number
  gridHeight?: number
}>()

const panX = ref(0)
const panY = ref(0)
const zoom = ref(1)
</script>