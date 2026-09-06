// ─── Remark Wiki-Links Plugin ──────────────────────────────────────
// Custom Remark plugin that intercepts [[Node Title]] text nodes
// and transforms them into NuxtLink AST nodes pointing to /wiki/<slug>.
//
// Constitution Mandate (Sprint 1.8, §2):
//   The conversion of [[Wiki-Links]] to Nuxt routing links must occur
//   exclusively during server-side Markdown-to-AST compilation.

import { visit, type Visitor } from 'unist-util-visit'
import type { Root, Text, Link, Paragraph } from 'mdast'
import { slugifyTitle } from '../../core/domain/wiki-node'

// Regex to match [[Node Title]] patterns
const WIKI_LINK_RE = /\[\[([^\]]+)\]\]/g

/**
 * Remark plugin that transforms [[Wiki-Links]] to /wiki/<slug> links.
 * Operates on the mdast tree, replacing text nodes containing
 * [[ brackets ]] with proper link AST nodes.
 */
export function remarkWikiLinks() {
  return (tree: Root) => {
    // Use transform function type that works with mdast types
    visit(tree, 'paragraph', (node: Paragraph, index: number | null, parent: Root | null) => {
      if (!parent || index === null || index === undefined) return

      const newChildren: (Text | Link)[] = []

      for (const child of node.children) {
        if (child.type === 'text') {
          const value = child.value
          let lastIndex = 0
          let match: RegExpExecArray | null

          // Reset regex state
          WIKI_LINK_RE.lastIndex = 0

          while ((match = WIKI_LINK_RE.exec(value)) !== null) {
            const beforeText = value.slice(lastIndex, match.index)
            const linkTitle = match[1].trim()

            // Push text before the match
            if (beforeText) {
              newChildren.push({ type: 'text', value: beforeText })
            }

            // Create a link node for non-empty titles
            if (linkTitle) {
              const slug = slugifyTitle(linkTitle)
              const linkNode: Link = {
                type: 'link',
                url: `/wiki/${slug}`,
                title: linkTitle,
                children: [{ type: 'text', value: linkTitle }],
              }
              newChildren.push(linkNode)
            }

            lastIndex = match.index + match[0].length
          }

          // Push remaining text after last match
          const remainingText = value.slice(lastIndex)
          if (remainingText) {
            newChildren.push({ type: 'text', value: remainingText })
          }
        } else {
          // Preserve non-text children as-is
          newChildren.push(child as Link)
        }
      }

      // Replace the paragraph's children with our transformed children
      node.children = newChildren
    })
  }
}

// Default export for @nuxtjs/mdc remarkPlugins compatibility
export default remarkWikiLinks