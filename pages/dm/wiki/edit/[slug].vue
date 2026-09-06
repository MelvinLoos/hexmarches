<template>
  <div class="dm-wiki-edit-page">
    <h1 class="page-title">Edit Wiki Node</h1>

    <div v-if="loading" class="wiki-loading">Loading...</div>

    <GmWikiEditor
      v-else
      :initial-title="initialTitle"
      :initial-content="initialContent"
      :initial-path="initialPath"
      @save="handleSave"
    />

    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :data-testid="toast.type === 'success' ? 'toast-success' : 'toast-error'"
          :class="['toast', `toast-${toast.type}`]"
        >
          {{ toast.message }}
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useWikiService } from '~/composables/useWikiService'
import { useToast } from '~/composables/useToast'
import type { WikiNode } from '~/src/core/domain/wiki-node'

const route = useRoute()
const wikiService = useWikiService()
const { toasts, success: showSuccess, error: showError } = useToast()

const initialTitle = ref('')
const initialContent = ref('')
const initialPath = ref('')
const editingNodeId = ref<string | null>(null)
const loading = ref(true)

const ltreePath = computed(() => {
  const slug = route.params.slug as string
  return slug || ''
})

async function loadExistingNode() {
  try {
    const node = await wikiService.findByPath(ltreePath.value)
    if (node) {
      editingNodeId.value = node.id
      initialTitle.value = node.title
      initialContent.value = node.content
      initialPath.value = node.path
    }
  } catch {
    showError('Failed to load node for editing.')
  } finally {
    loading.value = false
  }
}

async function handleSave(payload: { title: string; content: string; path: string }) {
  try {
    if (editingNodeId.value) {
      await wikiService.updateNode(editingNodeId.value, {
        title: payload.title,
        content: payload.content,
        path: payload.path,
      })
      showSuccess(`"${payload.title}" updated successfully!`)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    showError(`Save failed: ${message}`)
  }
}

onMounted(loadExistingNode)
</script>

<style scoped>
.dm-wiki-edit-page { padding: 24px; background: #1a1a2e; color: #e0e0e0; min-height: 100vh; }
.page-title { margin-bottom: 24px; font-size: 1.5rem; color: #e94560; }
.wiki-loading { color: #a0a0b0; font-size: 1rem; text-align: center; padding: 48px 0; }
.toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 1000; display: flex; flex-direction: column; gap: 8px; }
.toast { padding: 12px 20px; border-radius: 8px; font-size: 0.9rem; color: #fff; min-width: 250px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
.toast-success { background: #2e7d32; }
.toast-error { background: #c62828; }
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from { opacity: 0; transform: translateY(20px); }
.toast-leave-to { opacity: 0; transform: translateX(100%); }
</style>