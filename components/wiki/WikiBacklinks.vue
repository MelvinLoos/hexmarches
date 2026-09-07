<template>
  <div v-if="title" data-testid="wiki-backlinks" class="wiki-backlinks">
    <div v-if="backlinks && backlinks.length > 0" data-testid="wiki-backlinks-results">
      <h3 class="backlinks-heading">Referenced By</h3>
      <ul class="backlinks-list">
        <li v-for="node in backlinks" :key="node.id" data-testid="backlink-item" class="backlink-item">
          <NuxtLink
            :to="`/wiki/${node.path.replace(/\./g, '/')}`"
            class="backlink-link"
          >
            {{ node.title }}
          </NuxtLink>
        </li>
      </ul>
    </div>
    <div v-else-if="loaded" data-testid="backlink-empty" class="backlinks-empty">
      No pages reference this entry.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useWikiService } from '~/composables/useWikiService'
import type { WikiNode } from '~/src/core/domain/wiki-node'

const props = defineProps<{
  title: string
}>()

const wikiService = useWikiService()
const backlinks = ref<WikiNode[]>([])
const loaded = ref(false)

async function fetchBacklinks() {
  if (!props.title) {
    backlinks.value = []
    loaded.value = false
    return
  }
  try {
    backlinks.value = await wikiService.getInboundReferences(props.title)
  } catch {
    backlinks.value = []
  } finally {
    loaded.value = true
  }
}

onMounted(fetchBacklinks)
watch(() => props.title, fetchBacklinks)
</script>

<style scoped>
.wiki-backlinks {
  margin-top: 32px;
  padding: 16px;
  border-top: 1px solid #0f3460;
}
.backlinks-heading {
  font-size: 0.85rem;
  color: #a0a0b0;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
}
.backlinks-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.backlink-item {
  padding: 4px 0;
}
.backlink-link {
  color: #e94560;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.15s;
}
.backlink-link:hover {
  color: #f75973;
}
.backlinks-empty {
  color: #666;
  font-size: 0.8rem;
  font-style: italic;
}
</style>
