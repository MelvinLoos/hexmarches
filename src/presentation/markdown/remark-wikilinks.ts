// ─── Remark Wiki-Links Plugin ──────────────────────────────────────
// Custom Remark plugin that intercepts [[Node Title]] text nodes
// and transforms them into raw HTML AST nodes (`<wiki-link title="...">`)
// that Nuxt MDC's remark2rehype bridge (with allowDangerousHtml + rehype-raw)
// parses into HAST elements, resolved as Vue components at compile time.
//
// Constitution Mandate (Sprint 1.8, §2):
//   The conversion of [[Wiki-Links]] must occur during Markdown-to-AST
//   compilation, but path resolution is deferred to the Vue component.

import { visit } from 'unist-util-visit'
import type { Root, Text, Html } from 'mdast'

// Regex to match [[Node Title]] patterns
const WIKI_LINK_RE = /\[\[([^\]]+)\]\]/g

/**
 * Remark plugin that transforms [[Wiki-Links]] into `<wiki-link title="...">`
 * HTML AST nodes. These are parsed by rehype-raw into custom HAST elements
 * that Nuxt MDC resolves as Vue components (components/content/WikiLink.vue).
 */
export function remarkWikiLinks() {
  return (tree: Root) => {
    visit(tree, 'paragraph', (node: { children: (Text | Html)[] }) => {
      const newChildren: (Text | Html)[] = []

      for (const child of node.children) {
        if (child.type !== 'text') {
          newChildren.push(child)
          continue
        }

        const value = child.value
        let lastIndex = 0
        let match: RegExpExecArray | null

        WIKI_LINK_RE.lastIndex = 0
        while ((match = WIKI_LINK_RE.exec(value)) !== null) {
          const beforeText = value.slice(lastIndex, match.index)
          const linkTitle = match[1].trim()

          if (beforeText) {
            newChildren.push({ type: 'text', value: beforeText } as Text)
          }

          if (linkTitle) {
            // Emit a raw HTML node that rehype-raw parses into <wiki-link>
            newChildren.push({
              type: 'html',
              value: `<wiki-link title="${linkTitle}"></wiki-link>`,
            } as Html)
          }

          lastIndex = match.index + match[0].length
        }

        const remainingText = value.slice(lastIndex)
        if (remainingText) {
          newChildren.push({ type: 'text', value: remainingText } as Text)
        }
      }

      node.children = newChildren
    })
  }
}

// Default export for @nuxtjs/mdc remarkPlugins compatibility
export default remarkWikiLinks