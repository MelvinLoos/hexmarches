<template>
  <div
    data-testid="wiki-link-suggestions"
    class="w-72 overflow-hidden rounded-lg border border-gm-border bg-gm-bg shadow-xl"
  >
    <div class="flex items-center justify-between border-b border-gm-border px-3 py-2">
      <span class="text-xs uppercase tracking-wider text-gm-muted">Wiki Links</span>
      <span
        v-if="loading"
        data-testid="wiki-link-suggestions-loading"
        class="text-xs text-gm-muted"
      >
        Searching…
      </span>
    </div>
    <div class="max-h-48 overflow-y-auto">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        data-testid="wiki-link-suggestion-item"
        class="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-gm-text hover:bg-gm-border transition-colors"
        @click="command(item)"
      >
        <span class="truncate">{{ item.title }}</span>
        <span class="shrink-0 text-[10px] uppercase tracking-wider text-gm-primary">
          {{ item.entityType || 'GENERAL' }}
        </span>
      </button>
      <div
        v-if="items.length === 0 && !loading"
        data-testid="wiki-link-suggestions-empty"
        class="px-3 py-3 text-center text-sm text-gm-muted"
      >
        No matching nodes
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ─── Pure Wiki-Link Suggestion UI ─────────────────────────────────
// Rendered by @tiptap/suggestion via VueRenderer at the editor cursor.
// This component deliberately avoids Nuxt/Vue app-context features:
// selection flows exclusively through the injected `command` callback
// supplied by the suggestion plugin (see WikiLink extension).
import type { WikiLinkSuggestionItem } from '../extensions/WikiLink'

defineProps<{
  items: WikiLinkSuggestionItem[]
  loading: boolean
  command: (item: WikiLinkSuggestionItem) => void
  query: string
  text: string
}>()
</script>