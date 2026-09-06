<template>
  <div class="dm-wiki-edit-page">
    <h1 class="page-title">Edit Wiki Node</h1>
    <GmWikiEditor
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import GmWikiEditor from '~/presentation/components/GmWikiEditor.vue'

function handleSave(payload: { title: string; content: string; path: string }) {
  // Will be connected to WikiService in the full integration
  console.log('Save wiki node:', payload)
}
</script>

<style scoped>
.dm-wiki-edit-page {
  padding: 24px;
  background: #1a1a2e;
  color: #e0e0e0;
  min-height: 100vh;
}
.page-title {
  margin-bottom: 24px;
  font-size: 1.5rem;
  color: #e94560;
}
</style>