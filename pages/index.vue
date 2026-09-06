<template>
  <div class="home-page">
    <h2 class="section-title">Virtual Tabletop</h2>
    <VttCanvas :hex-radius="30" :grid-width="20" :grid-height="15" />
  </div>
</template>

<script setup lang="ts">
import VttCanvas from '../src/presentation/components/VttCanvas.vue'
</script>

<style scoped>
.home-page {
  max-width: 100%;
}
.section-title {
  margin-bottom: 16px;
  font-size: 1.25rem;
  color: #e94560;
}
</style>