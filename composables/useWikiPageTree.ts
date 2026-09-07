import { ref, computed } from 'vue'
import { useWikiService } from '~/composables/useWikiService'
import type { WikiNode } from '~/src/core/domain/wiki-node'

// Singleton page tree — shared across WikiSidebar and WikiLink
const tree = ref<WikiNode[]>([])
const loaded = ref(false)
let loadingPromise: Promise<void> | null = null

export function useWikiPageTree() {
  const wikiService = useWikiService()

  // Lazy-load the full tree once
  async function ensureLoaded() {
    if (loaded.value) return
    if (loadingPromise) {
      await loadingPromise
      return
    }
    loadingPromise = (async () => {
      try {
        tree.value = await wikiService.getNodeTree('')
      } catch {
        tree.value = []
      } finally {
        loaded.value = true
      }
    })()
    await loadingPromise
  }

  // Build title → path map from the tree
  const titlePathMap = computed(() => {
    const map = new Map<string, string>()
    for (const node of tree.value) {
      map.set(node.title, node.path)
    }
    return map
  })

  function findNodeByTitle(title: string): WikiNode | undefined {
    return tree.value.find(n => n.title === title)
  }

  return { tree, loaded, titlePathMap, ensureLoaded, findNodeByTitle }
}
