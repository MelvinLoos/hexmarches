<template>
  <div class="wiki-renderer" v-html="renderedHtml"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  content: string
}>()

/**
 * Simple markdown-to-HTML converter for inline rendering.
 * For production, @nuxtjs/mdc would handle MDC component syntax
 * (e.g., ::handout{...}) and full markdown parsing.
 * This provides a baseline for testing the renderer wrapper.
 */
function parseMarkdown(md: string): string {
  if (!md) return ''

  let html = md
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />')

  // Wrap in paragraph if not already
  if (!html.startsWith('<h') && !html.startsWith('<p>')) {
    html = '<p>' + html + '</p>'
  }

  return html
}

const renderedHtml = computed(() => parseMarkdown(props.content))
</script>

<style scoped>
.wiki-renderer {
  padding: 16px;
  color: #e0e0e0;
  line-height: 1.6;
}
.wiki-renderer :deep(h1),
.wiki-renderer :deep(h2),
.wiki-renderer :deep(h3) {
  color: #e94560;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}
.wiki-renderer :deep(p) {
  margin-bottom: 1em;
}
.wiki-renderer :deep(strong) {
  color: #fff;
}
</style>