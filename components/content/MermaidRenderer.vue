<template>
  <ClientOnly>
    <div class="mermaid-renderer" v-html="svgContent" />
    <template #fallback>
      <div class="mermaid-renderer mermaid-loading">
        <pre class="mermaid-fallback">{{ code }}</pre>
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const props = defineProps<{
  code: string
}>()

let mermaidModule: typeof import('mermaid').default | null = null

const svgContent = ref('')
const renderId = `mermaid-${Math.random().toString(36).slice(2, 9)}`

async function renderDiagram() {
  if (!props.code) return
  try {
    // Dynamic import to avoid SSR issues
    if (!mermaidModule) {
      const mod = await import('mermaid')
      mermaidModule = mod.default
      mermaidModule.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'loose',
      })
    }
    const { svg } = await mermaidModule.render(renderId, props.code)
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
.mermaid-fallback {
  background: #1a1a2e;
  border: 1px solid #0f3460;
  border-radius: 6px;
  padding: 12px;
  color: #a0a0b0;
  font-family: monospace;
  white-space: pre-wrap;
  overflow-x: auto;
}
</style>