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
          <NuxtLink to="/dm/wiki/edit" class="create-link">
            Create this page
          </NuxtLink>
        </div>
        <article v-else-if="node" class="wiki-article">
          <h1 class="wiki-node-title">{{ node.title }}</h1>
          <WikiRenderer :content="node.content" />
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useWikiService } from '~/composables/useWikiService'
import type { WikiNode } from '~/src/core/domain/wiki-node'

// WikiSidebar and WikiRenderer are auto-imported by Nuxt
// from components/wiki/WikiSidebar.vue and src/presentation/components/WikiRenderer.vue

const route = useRoute()
const wikiService = useWikiService()

const ltreePath = computed(() => {
  const slug = route.params.slug as string | string[]
  const segments = Array.isArray(slug) ? slug : [slug].filter(Boolean)
  return segments.join('.')
})

const loading = ref(true)
const node = ref<WikiNode | null>(null)
const sidebarNodes = ref<WikiNode[]>([])

async function fetchNode() {
  loading.value = true
  try {
    const [foundNode, allNodes] = await Promise.all([
      wikiService.findByPath(ltreePath.value),
      wikiService.getNodeTree(''),
    ])
    node.value = foundNode
    sidebarNodes.value = allNodes
  } finally {
    loading.value = false
  }
}

onMounted(fetchNode)

// Refetch when route changes within the same page component
watch(() => route.params.slug, () => {
  if (route.params.slug) fetchNode()
})

const notFound = computed(() => !loading.value && !node.value)
</script>

<style scoped>
.wiki-viewer-page {
  padding: 0;
  height: 100%;
}
.wiki-layout {
  display: flex;
  gap: 0;
  min-height: calc(100vh - 120px);
}
.wiki-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
.wiki-loading {
  color: #a0a0b0;
  font-size: 1rem;
  text-align: center;
  padding: 48px 0;
}
.wiki-not-found {
  text-align: center;
  padding: 48px 0;
  color: #a0a0b0;
}
.wiki-not-found h2 {
  color: #e94560;
  margin-bottom: 12px;
}
.wiki-not-found code {
  background: #0f3460;
  padding: 2px 8px;
  border-radius: 4px;
  color: #e0e0e0;
}
.create-link {
  display: inline-block;
  margin-top: 16px;
  padding: 8px 16px;
  background: #e94560;
  color: #fff;
  text-decoration: none;
  border-radius: 6px;
}
.wiki-article {
  max-width: 800px;
}
.wiki-node-title {
  color: #e94560;
  margin-bottom: 24px;
  font-size: 1.75rem;
  border-bottom: 1px solid #0f3460;
  padding-bottom: 12px;
}
</style>