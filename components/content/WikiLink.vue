<template>
  <NuxtLink
    v-if="resolvedPath && !missing"
    :to="resolvedPath"
    class="wiki-link"
    :class="{ 'wiki-link-entity': entityType }"
    :data-entity-type="entityType"
  >
    {{ title }}
  </NuxtLink>
  <span v-else data-testid="wiki-link-broken" class="wiki-link-broken" :title="`Page not found: ${title}`">
    {{ title }}
    <sup class="broken-indicator">?</sup>
  </span>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWikiPageTree } from '~/composables/useWikiPageTree'

const props = defineProps<{
  title: string
}>()

const { titlePathMap, ensureLoaded, findNodeByTitle } = useWikiPageTree()
const ready = ref(false)

// Resolve the full ltree path for this title
const resolvedPath = computed(() => {
  const path = titlePathMap.value.get(props.title)
  if (!path) return null
  return `/wiki/${path.replace(/\./g, '/')}`
})

const node = computed(() => findNodeByTitle(props.title))
const entityType = computed(() => node.value?.entityType ?? null)
const missing = computed(() => ready.value && !resolvedPath.value)

onMounted(async () => {
  await ensureLoaded()
  ready.value = true
})
</script>

<style scoped>
.wiki-link {
  color: #e94560;
  text-decoration: none;
  border-bottom: 1px dashed #e94560;
  transition: color 0.15s, border-color 0.15s;
}
.wiki-link:hover {
  color: #f75973;
  border-color: #f75973;
}
.wiki-link-entity::after {
  content: attr(data-entity-type);
  font-size: 0.6rem;
  vertical-align: super;
  margin-left: 2px;
  opacity: 0.6;
}
.wiki-link-broken {
  color: #d4a72c;
  text-decoration: underline;
  text-decoration-style: wavy;
  text-decoration-color: #d4a72c;
  text-underline-offset: 3px;
  cursor: help;
}
.broken-indicator {
  color: #d4a72c;
  font-size: 0.7rem;
}
</style>
