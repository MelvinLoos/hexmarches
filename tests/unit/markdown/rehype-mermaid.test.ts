// ─── Sprint 1.9: Task 2 — Rehype Mermaid Plugin ─────────────────────
// Tests that the rehype plugin correctly transforms <pre language="mermaid">
// elements into <mermaid-renderer> component nodes.

import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import { rehypeMermaid } from '~/src/presentation/markdown/rehype-mermaid'
import type { Root } from 'hast'

function findMermaidNodes(ast: Root) {
  const nodes: Array<{ tagName: string; properties: Record<string, unknown> }> = []
  function walk(node: unknown) {
    const el = node as { type: string; tagName?: string; properties?: Record<string, unknown>; children?: unknown[] }
    if (el.type === 'element' && el.tagName === 'mermaid-renderer') {
      nodes.push({ tagName: el.tagName, properties: el.properties ?? {} })
    }
    if (el.children) {
      for (const child of el.children) walk(child)
    }
  }
  walk(ast)
  return nodes
}

function findPreNodes(ast: Root) {
  let count = 0
  function walk(node: unknown) {
    const el = node as { type: string; tagName?: string; children?: unknown[] }
    if (el.type === 'element' && el.tagName === 'pre') count++
    if (el.children) {
      for (const child of el.children) walk(child)
    }
  }
  walk(ast)
  return count
}

async function processMarkdown(input: string): Promise<Root> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)

  const parsed = processor.parse(input)
  const hast = (await processor.run(parsed)) as Root

  // Apply rehype-mermaid plugin directly to the tree
  const mermaidPlugin = rehypeMermaid()
  mermaidPlugin(hast)

  return hast
}

describe('Sprint 1.9: rehype-mermaid plugin', () => {
  it('transforms mermaid code block into mermaid-renderer element', async () => {
    const input = '```mermaid\ngraph TD\n  A-->B\n```\n'
    const ast = await processMarkdown(input)

    const mermaidNodes = findMermaidNodes(ast)
    expect(mermaidNodes).toHaveLength(1)
    expect(mermaidNodes[0].tagName).toBe('mermaid-renderer')
    expect(mermaidNodes[0].properties.code).toBe('graph TD\n  A-->B')
  })

  it('does NOT transform non-mermaid code blocks', async () => {
    const input = '```javascript\nconsole.log("hi")\n```\n'
    const ast = await processMarkdown(input)

    const mermaidNodes = findMermaidNodes(ast)
    const preCount = findPreNodes(ast)

    expect(mermaidNodes).toHaveLength(0)
    expect(preCount).toBe(1)
  })

  it('handles mixed mermaid and non-mermaid blocks', async () => {
    const input = '```mermaid\ngraph TD\n```\n\n```python\nprint("hi")\n```\n'
    const ast = await processMarkdown(input)

    const mermaidNodes = findMermaidNodes(ast)
    const preCount = findPreNodes(ast)

    expect(mermaidNodes).toHaveLength(1)
    expect(preCount).toBe(1)
  })

  it('handles empty mermaid code block', async () => {
    const input = '```mermaid\n\n```\n'
    const ast = await processMarkdown(input)

    const mermaidNodes = findMermaidNodes(ast)
    // Empty code block should not render a mermaid-renderer
    expect(mermaidNodes).toHaveLength(0)
  })

  it('preserves code content in mermaid-renderer', async () => {
    const input = '```mermaid\ngraph TD\n  A-->B\n```\n'
    const ast = await processMarkdown(input)

    const mermaidNodes = findMermaidNodes(ast)

    expect(mermaidNodes).toHaveLength(1)
    expect(mermaidNodes[0].properties.code).toBe('graph TD\n  A-->B')
  })
})