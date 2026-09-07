<template>
  <div class="dm-wiki-edit-page">
    <h1 class="page-title">Create Wiki Node</h1>

    <GmWikiEditor
      :initial-title="initialTitle"
      :initial-content="initialContent"
      :initial-path="initialPath"
      :parent-options="parentOptions"
      @save="handleSave"
      @upload-image="handleUploadImage"
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWikiService } from '~/composables/useWikiService'
import { useToast } from '~/composables/useToast'
import type { WikiNode } from '~/src/core/domain/wiki-node'

const router = useRouter()
const wikiService = useWikiService()
const { toasts, success: showSuccess, error: showError } = useToast()

const initialTitle = ref('')
const initialContent = ref('')
const initialPath = ref('')
const parentOptions = ref<WikiNode[]>([])

onMounted(async () => {
  try {
    parentOptions.value = await wikiService.getNodeTree('')
  } catch {
    // keep empty options
  }
})

async function handleSave(payload: { title: string; content: string; path: string; coverImageUrl?: string; entityType?: string }) {
  try {
    await wikiService.createNode({
      title: payload.title,
      content: payload.content,
      path: payload.path,
      coverImageUrl: payload.coverImageUrl,
      entityType: payload.entityType,
    })
    showSuccess(`"${payload.title}" created successfully!`)
    const wikiUrl = `/wiki/${payload.path.replace(/\./g, '/')}`
    router.push(wikiUrl)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    showError(`Save failed: ${message}`)
  }
}

async function handleUploadImage(file: File, callback: (url: string) => void) {
  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `wiki-covers/${Date.now()}_${safeName}`

    const { data, error } = await useSupabaseClient().storage
      .from('wiki-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) {
      console.error('Upload failed:', error)
      showError(`Upload failed: ${error.message}`)
      return
    }

    if (data) {
      const publicUrl = useSupabaseClient().storage
        .from('wiki-assets')
        .getPublicUrl(data.path).data.publicUrl
      callback(publicUrl)
    }
  } catch (err) {
    console.error('Upload failed:', err)
    showError('Failed to upload image.')
  }
}
</script>

<style scoped>
.dm-wiki-edit-page { padding: 24px; background: #1a1a2e; color: #e0e0e0; min-height: 100vh; }
.page-title { margin-bottom: 24px; font-size: 1.5rem; color: #e94560; }
.toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 1000; display: flex; flex-direction: column; gap: 8px; }
.toast { padding: 12px 20px; border-radius: 8px; font-size: 0.9rem; color: #fff; min-width: 250px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
.toast-success { background: #2e7d32; }
.toast-error { background: #c62828; }
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from { opacity: 0; transform: translateY(20px); }
.toast-leave-to { opacity: 0; transform: translateX(100%); }
</style>
