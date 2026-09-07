// ─── Remark Wiki-Links Plugin ──────────────────────────────────────
// Custom Remark plugin that intercepts [[Node Title]] text nodes
// and transforms them into :wiki-link{title="Node Title"} MDC inline
// component syntax, so the Vue component resolves the full ltree path
// at runtime via shared page tree state.
//
// Constitution Mandate (Sprint 1.8, §2):
//   The conversion of [[Wiki-Links]] must occur during Markdown-to-AST
//   compilation, but path resolution is deferred to the Vue component.

import { visit } from 'unist-util-visit'
import type { Root } from 'mdast'

// Regex to match [[Node Title]] patterns
const WIKI_LINK_RE = /\[\[([^\]]+)\]\]/g

/**
 * Remark plugin that transforms [[Wiki-Links]] into :wiki-link{title="..."}
 * MDC inline component syntax in the text content.
 */
export function remarkWikiLinks() {
  return (tree: Root) => {
    visit(tree, 'text', (node: { value: string }) => {
      node.value = node.value.replace(WIKI_LINK_RE, (_match: string, title: string) => {
        const trimmed = title.trim()
        if (!trimmed) return '' // empty [[ ]] = remove
        return `:wiki-link{title="${trimmed}"}`
      })
    })
  }
}

// Default export for @nuxtjs/mdc remarkPlugins compatibility
export default remarkWikiLinks