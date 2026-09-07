<template>
  <div class="mermaid-renderer" v-html="svgContent" />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import mermaid from 'mermaid'

const props = defineProps<{
  code: string
}>()

// Initialize mermaid once
let initialized = false
function ensureInit() {
  if (!initialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
    })
    initialized = true
  }
}

const svgContent = ref('')
const renderId = `mermaid-${Math.random().toString(36).slice(2, 9)}`

async function renderDiagram() {
  if (!props.code) return
  ensureInit()
  try {
    const { svg } = await mermaid.render(renderId, props.code)
    svgContent.value = svg
  } catch (err) {
    console.error('[MermaidRenderer] Failed to render diagram:', err)
    svgContent.value = `<pre class="mermaid-error">Mermaid render error: ${(err as Error).message}</pre>`
  }
}

onMounted(renderDiagram)
watch(() => props.code, renderDiagram)
</script>

<style scoped>
.mermaid-renderer {
  display: flex;
  justify-content: center;
  padding: 16px 0;
  overflow-x: auto;
}
.mermaid-renderer :deep(svg) {
  max-width: 100%;
  height: auto;
}
.mermaid-renderer :deep(.mermaid-error) {
  color: #c62828;
  background: #1a1a2e;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #c62828;
  font-family: monospace;
  white-space: pre-wrap;
}
</style>