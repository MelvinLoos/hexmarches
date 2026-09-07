<template>
  <div class="wiki-viewer-page">
    <div class="wiki-layout">
      <WikiSidebar :nodes="sidebarNodes" />
      <div class="wiki-content">
        <div v-if="loading" data-testid="wiki-loading" class="wiki-loading">
          Loading...
        </div>
        <div v-else-if="notFound" data-testid="wiki-not-found" class="wiki-not-found">
          <h2>Page Not Found</h2>
          <p>The wiki page "<code>{{ ltreePath }}</code>" does not exist.</p>
          <NuxtLink :to="`/dm/wiki/edit/${ltreePath.replace(/\./g, '/')}`" class="create-link">
            Create this page
          </NuxtLink>
        </div>
        <article v-else-if="node" class="wiki-article">
          <div class="wiki-title-row">
            <h1 class="wiki-node-title">{{ node.title }}</h1>
            <div v-if="isGm" class="wiki-actions">
              <NuxtLink
                :to="`/dm/wiki/edit/${ltreePath.replace(/\./g, '/')}`"
                class="action-btn edit-btn"
                data-testid="wiki-edit-button"
              >
                Edit
              </NuxtLink>
              <button
                class="action-btn delete-btn"
                data-testid="wiki-delete-button"
                @click="handleDelete"
              >
                Delete
              </button>
            </div>
          </div>
          <WikiRenderer :content="node.content" />
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWikiService } from '~/composables/useWikiService'
import { useGmStatus } from '~/composables/useGmStatus'
import { useToast } from '~/composables/useToast'
import type { WikiNode } from '~/src/core/domain/wiki-node'

const route = useRoute()
const router = useRouter()
const wikiService = useWikiService()
const { isGm } = useGmStatus()
const { success: showSuccess, error: showError } = useToast()

const ltreePath = computed(() => {
  const slug = route.params.slug as string | string[]
  if (!slug) return ''
  const segments = Array.isArray(slug) ? slug : [slug].filter(Boolean)
  return segments.join('.')
})

const loading = ref(true)
const node = ref<WikiNode | null>(null)
const sidebarNodes = ref<WikiNode[]>([])

async function fetchNode() {
  loading.value = true
  try {
    const allNodes = await wikiService.getNodeTree('')
    sidebarNodes.value = allNodes

    if (ltreePath.value) {
      node.value = await wikiService.findByPath(ltreePath.value)
    }
  } catch {
    // API unavailable — show empty state
  } finally {
    loading.value = false
  }
}

async function handleDelete() {
  if (!node.value) return
  if (!confirm(`Delete "${node.value.title}"? This cannot be undone.`)) return

  try {
    await wikiService.deleteNode(node.value.id)
    showSuccess(`"${node.value.title}" deleted.`)
    router.push('/wiki')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    showError(`Delete failed: ${message}`)
  }
}

onMounted(fetchNode)

watch(() => route.params.slug, () => {
  fetchNode()
})

const notFound = computed(() => !loading.value && !node.value)
</script>

<style scoped>
.wiki-viewer-page { padding: 0; height: 100%; }
.wiki-layout { display: flex; gap: 0; min-height: calc(100vh - 120px); }
.wiki-content { flex: 1; padding: 24px; overflow-y: auto; }
.wiki-loading { color: #a0a0b0; font-size: 1rem; text-align: center; padding: 48px 0; }
.wiki-not-found { text-align: center; padding: 48px 0; color: #a0a0b0; }
.wiki-not-found h2 { color: #e94560; margin-bottom: 12px; }
.wiki-not-found code { background: #0f3460; padding: 2px 8px; border-radius: 4px; color: #e0e0e0; }
.create-link { display: inline-block; margin-top: 16px; padding: 8px 16px; background: #e94560; color: #fff; text-decoration: none; border-radius: 6px; }
.create-link:hover { background: #f75973; }
.wiki-article { max-width: 800px; }
.wiki-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; border-bottom: 1px solid #0f3460; padding-bottom: 12px; }
.wiki-node-title { color: #e94560; font-size: 1.75rem; margin: 0; border: none; padding: 0; }
.wiki-actions { display: flex; gap: 8px; flex-shrink: 0; }
.action-btn { padding: 6px 14px; font-size: 0.8rem; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; }
.edit-btn { background: #0f3460; color: #e0e0e0; }
.edit-btn:hover { background: #1a5276; }
.delete-btn { background: #c62828; color: #fff; }
.delete-btn:hover { background: #e53935; }
</style>
