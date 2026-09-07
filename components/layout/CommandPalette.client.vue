<template>
  <div data-testid="cmd-palette-container" class="cmd-palette-container">
    <-- Command Palette Modal: shown when Meta+K or Ctrl+Shift+K is pressed or trigger button clicked -->
    <div v-if="visible" data-testid="cmd-palette-modal" class="cmd-palette-modal">
      <div data-testid="cmd-palette-backdrop" class="cmd-palette-backdrop" @click="close" />
      <div ref="modalRef" class="cmd-palette-content">
        <input
          ref="inputRef"
          v-model="query"
          data-testid="cmd-palette-input"
          type="text"
          placeholder="Search wiki nodes..."
          class="cmd-palette-input"
          autofocus
        />
        <div class="cmd-palette-results">
          <template v-for="(group, type) in groupedResults" :key="type">
            <div data-testid="cmd-palette-group-header" class="cmd-palette-group-header">
              {{ type }}
            </div>
            <div
              v-for="result in group"
              :key="result.node.id"
              data-testid="cmd-palette-result"
              class="cmd-palette-result-item"
            >
              <NuxtLink
                :to="`/wiki/${result.node.path.replace(/\./g, '/')}`"
                class="cmd-palette-result-link"
                @click="close"
              >
                <span class="result-title">{{ result.node.title }}</span>
                <span class="result-path">{{ result.node.path }}</span>
              </NuxtLink>
            </div>
          </template>
          <div v-if="query && !hasResults" class="cmd-palette-empty">
            No results found.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useMagicKeys, onClickOutside, useDebounceFn } from '@vueuse/core'
import { useWikiService } from '~/composables/useWikiService'
import type { WikiNodeSearchResult } from '~/src/core/domain/wiki-repository'

const { current } = useMagicKeys()
const wikiService = useWikiService()

const visible = ref(false)
const query = ref('')
const results = ref<WikiNodeSearchResult[]>([])
const modalRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

// Group results by entity_type
const groupedResults = computed(() => {
  const groups: Record<string, WikiNodeSearchResult[]> = {}
  const arr = Array.isArray(results.value) ? results.value : []
  for (const r of arr) {
    const type = r.node.entityType || 'GENERAL'
    if (!groups[type]) groups[type] = []
    groups[type].push(r)
  }
  return groups
})

const hasResults = computed(() => Array.isArray(results.value) ? results.value.length > 0 : false)

// Watch magic keys: Meta+K or Ctrl+Shift+K to open, Escape to close
watch(current, (keys) => {
  if (
    (keys.has('Meta') && keys.has('k')) ||
    (keys.has('Control') && keys.has('Shift') && keys.has('K'))
  ) {
    visible.value = true
    query.value = ''
    results.value = []
    // Focus input on next tick after modal appears
    setTimeout(() => inputRef.value?.focus(), 50)
  }
  if (keys.has('Escape')) {
    close()
  }
})

// Close handler
function close() {
  visible.value = false
  query.value = ''
  results.value = []
}

// Debounced search via useDebounceFn
const debouncedSearch = useDebounceFn(async (q: string) => {
  if (!q.trim()) {
    results.value = []
    return
  }
  try {
    results.value = await wikiService.searchNodes(q, 10)
  } catch {
    results.value = []
  }
}, 300)

// Watch query changes to trigger search
watch(query, (val) => {
  debouncedSearch(val)
})

// Close on click outside
onClickOutside(modalRef, () => {
  visible.value = false
})
</script>

<style scoped>
.cmd-palette-container {
  position: relative;
}
.cmd-palette-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
}
.cmd-palette-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
}
.cmd-palette-content {
  position: relative;
  width: 560px;
  max-width: 90vw;
  background: #1a1a2e;
  border: 1px solid #0f3460;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  z-index: 1;
}
.cmd-palette-input {
  width: 100%;
  padding: 14px 16px;
  background: transparent;
  border: none;
  border-bottom: 1px solid #0f3460;
  color: #e0e0e0;
  font-size: 1rem;
  outline: none;
}
.cmd-palette-input::placeholder {
  color: #666;
}
.cmd-palette-results {
  max-height: 320px;
  overflow-y: auto;
  padding: 8px 0;
}
.cmd-palette-group-header {
  padding: 6px 16px;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #e94560;
  background: rgba(233, 69, 96, 0.08);
  margin-top: 4px;
}
.cmd-palette-result-item {
  padding: 0;
}
.cmd-palette-result-link {
  display: flex;
  flex-direction: column;
  padding: 8px 16px;
  text-decoration: none;
  color: #e0e0e0;
  transition: background 0.15s;
}
.cmd-palette-result-link:hover {
  background: rgba(233, 69, 96, 0.12);
}
.result-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
}
.result-path {
  font-size: 0.7rem;
  color: #666;
  font-family: monospace;
  margin-top: 2px;
}
.cmd-palette-empty {
  padding: 16px;
  text-align: center;
  color: #666;
  font-size: 0.85rem;
}
</style>
