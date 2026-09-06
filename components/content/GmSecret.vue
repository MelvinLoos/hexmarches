<template>
  <aside v-if="isGm" data-testid="gm-secret" class="gm-secret">
    <div class="gm-secret-header">
      <span class="gm-secret-icon">&#128274;</span>
      <strong>{{ title }}</strong>
    </div>
    <div class="gm-secret-content">
      <slot />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useGmStatus } from '~/composables/useGmStatus'

defineProps<{
  title?: string
}>()

const { isGm } = useGmStatus()
</script>

<style scoped>
.gm-secret {
  border: 2px dashed #e94560;
  border-radius: 8px;
  padding: 12px 16px;
  margin: 16px 0;
  background: rgba(233, 69, 96, 0.08);
  color: #e0e0e0;
}
.gm-secret-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #e94560;
  font-size: 0.9rem;
}
.gm-secret-icon {
  font-size: 1.1rem;
}
.gm-secret-content {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #c0c0d0;
}
</style>