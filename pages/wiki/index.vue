<template>
  <div class="wiki-viewer-page">
    <div class="wiki-layout">
      <WikiSidebar :nodes="sidebarNodes" />
      <div class="wiki-content">
        <div v-if="loading" data-testid="wiki-loading" class="wiki-loading">Loading...</div>
        <div v-else data-testid="wiki-home" class="wiki-home">
          <h1 class="wiki-home-title">Campaign Wiki</h1>
          <p class="wiki-home-subtitle">Explore your campaign world</p>
          <div v-if="sidebarNodes.length === 0" class="wiki-empty">
            <p>No wiki pages yet.</p>
            <NuxtLink to="/dm/wiki/edit" class="create-link">Create your first page</NuxtLink>
          </div>
          <div v-else class="wiki-home-browse">
            <p>Select a page from the sidebar to start reading, or</p>
            <NuxtLink to="/dm/wiki/edit" class="create-link">Create a new page</NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useWikiService } from '~/composables/useWikiService'
import type { WikiNode } from '~/src/core/domain/wiki-node'

const wikiService = useWikiService()
const loading = ref(true)
const sidebarNodes = ref<WikiNode[]>([])

onMounted(async () => {
  try {
    sidebarNodes.value = await wikiService.getNodeTree('')
  } catch {
    // API unavailable — show empty state anyway
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.wiki-viewer-page { padding: 0; height: 100%; }
.wiki-layout { display: flex; gap: 0; min-height: calc(100vh - 120px); }
.wiki-content { flex: 1; padding: 24px; overflow-y: auto; }
.wiki-loading { color: #a0a0b0; font-size: 1rem; text-align: center; padding: 48px 0; }
.wiki-home { text-align: center; padding: 48px 0; color: #a0a0b0; }
.wiki-home-title { color: #e94560; margin-bottom: 8px; font-size: 2rem; }
.wiki-home-subtitle { color: #888; margin-bottom: 24px; font-size: 1rem; }
.wiki-home-browse p { margin-bottom: 12px; }
.wiki-empty p { margin-bottom: 12px; }
.create-link { display: inline-block; margin-top: 16px; padding: 8px 16px; background: #e94560; color: #fff; text-decoration: none; border-radius: 6px; }
.create-link:hover { background: #f75973; }
</style>