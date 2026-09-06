<template>
  <div class="handout-card">
    <div class="handout-header">
      <h3 class="handout-title">{{ title }}</h3>
    </div>
    <div class="handout-body">
      {{ content }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  content: string
}>()
</script>

<style scoped>
.handout-card {
  border: 2px solid #e94560;
  border-radius: 8px;
  background: #16213e;
  margin: 16px 0;
  overflow: hidden;
}
.handout-header {
  background: #e94560;
  padding: 8px 16px;
}
.handout-title {
  margin: 0;
  font-size: 1rem;
  color: #fff;
}
.handout-body {
  padding: 16px;
  color: #e0e0e0;
}
</style>