// ─── Rehype Mermaid Plugin ──────────────────────────────────────────
// Transforms <pre> elements containing mermaid code blocks into
// <mermaid-renderer code="..."> custom component nodes.
// This runs during rehype (H AST → component AST) compilation,
// before MDCRenderer resolves the component tree.
//
// Sprint 1.9: Render Engine Parity — ensures mermaid diagrams
// render identically in both the editor preview and the view page.

import { visit } from 'unist-util-visit'
import type { Root, Element, Text } from 'hast'

function getTextContent(node: Element): string {
  for (const child of node.children) {
    if (child.type === 'text') {
      return (child as Text).value
    }
  }
  return ''
}

function isMermaidBlock(node: Element): boolean {
  // Pattern 1: MDC code handler — language property on <pre>
  const lang = node.properties?.language
  if (typeof lang === 'string' && lang.toLowerCase() === 'mermaid') {
    return true
  }

  // Pattern 2: Standard remark-rehype — className on child <code>
  for (const child of node.children) {
    if (child.type === 'element') {
      const codeEl = child as Element
      if (codeEl.tagName === 'code') {
        const className = codeEl.properties?.className
        if (Array.isArray(className) && className.includes('language-mermaid')) {
          return true
        }
      }
    }
  }

  return false
}

function getCode(node: Element): string {
  // Pattern 1: MDC handler — code property on <pre>
  const code = node.properties?.code
  if (typeof code === 'string') return code

  // Pattern 2: Standard handler — text content inside child <code>
  for (const child of node.children) {
    if (child.type === 'element') {
      const codeEl = child as Element
      if (codeEl.tagName === 'code') {
        return getTextContent(codeEl)
      }
    }
  }

  return ''
}

/**
 * Rehype plugin that converts mermaid code blocks into
 * <mermaid-renderer> component nodes.
 */
export function rehypeMermaid() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'pre') return
      if (!parent || typeof index !== 'number') return

      if (!isMermaidBlock(node)) return

      const code = getCode(node).trim()
      if (!code) return

      // Replace the <pre> with a <mermaid-renderer> component node
      parent.children.splice(index, 1, {
        type: 'element',
        tagName: 'mermaid-renderer',
        properties: {
          code,
        },
        children: [],
      })
    })
  }
}

export default rehypeMermaid