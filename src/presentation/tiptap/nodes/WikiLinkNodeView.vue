<template>
  <node-view-wrapper
    as="span"
    data-testid="wiki-link-node-view"
    class="wiki-link-node-view"
    :class="{ 'is-selected': selected }"
    :data-title="node.attrs.title ?? ''"
  >
    <span class="wiki-link-pill">
      <span class="wiki-link-prefix">#</span>{{ node.attrs.title ?? '' }}
    </span>
  </node-view-wrapper>
</template>

<script setup lang="ts">
// ─── Wiki-Link NodeView ────────────────────────────────────────────
// Rendered inside the TipTap editor via VueNodeViewRenderer whenever a
// wikiLink node is in focus. Replaces the raw "[[Title]]" text with a
// styled, non-contenteditable badge (visual parity with the read-side
// `WikiLink.vue` component). Markdown serialization is untouched and
// continues to round-trip through the extension's `addStorage`.
import { NodeViewWrapper } from '@tiptap/vue-3'

const props = defineProps<{
  node: { attrs: { title?: string | null } }
  selected?: boolean
}>()
</script>

<style scoped>
.wiki-link-node-view {
  display: inline-flex;
  align-items: baseline;
  padding: 0 4px;
  border: 1px solid #e94560;
  border-radius: 4px;
  background: rgba(233, 69, 96, 0.08);
  color: #e94560;
  font-size: 0.9em;
  white-space: nowrap;
  cursor: pointer;
  vertical-align: baseline;
}
.wiki-link-node-view.is-selected {
  background: rgba(233, 69, 96, 0.2);
  outline: 1px solid #e94560;
  outline-offset: 1px;
}
.wiki-link-prefix {
  margin-right: 2px;
  opacity: 0.7;
}
.wiki-link-pill {
  font-weight: 500;
}
</style>