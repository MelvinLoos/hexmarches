// ─── Sprint 1.9: Task 1 — Markdown GFM Parity ───────────────────────
// Tests that remark-gfm produces the correct AST for task lists,
// strikethrough, and other GFM features.

import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import type { Root, ListItem, Delete } from 'mdast'

describe('Sprint 1.9: remark-gfm integration', () => {
  it('should parse task list items into listItem with checked property', async () => {
    const input = '- [ ] Incomplete task\n- [x] Completed task\n'
    const processor = unified().use(remarkParse).use(remarkGfm)
    const parsed = processor.parse(input)
    const ast = (await processor.run(parsed)) as Root

    const { visit } = await import('unist-util-visit')
    const listItems: Array<{ checked: boolean | null; spread: boolean }> = []
    visit(ast, 'listItem', (node) => {
      const li = node as ListItem
      listItems.push({ checked: li.checked, spread: li.spread })
    })

    expect(listItems).toHaveLength(2)
    expect(listItems[0].checked).toBe(false)
    expect(listItems[1].checked).toBe(true)
  })

  it('should parse strikethrough into delete node', async () => {
    const input = 'This is ~~strikethrough~~ text.'
    const processor = unified().use(remarkParse).use(remarkGfm)
    const parsed = processor.parse(input)
    const ast = (await processor.run(parsed)) as Root

    const { visit } = await import('unist-util-visit')
    const deleteNodes: unknown[] = []
    visit(ast, 'delete', (node) => {
      deleteNodes.push(node)
    })

    expect(deleteNodes).toHaveLength(1)
  })

  it('should parse autolinks when remark-gfm is active', async () => {
    const input = 'Visit https://example.com for more.'
    const processor = unified().use(remarkParse).use(remarkGfm)
    const parsed = processor.parse(input)
    const ast = (await processor.run(parsed)) as Root

    const { visit } = await import('unist-util-visit')
    const linkNodes: unknown[] = []
    visit(ast, 'link', (node) => {
      linkNodes.push(node)
    })

    expect(linkNodes).toHaveLength(1)
    const linkNode = linkNodes[0] as { url: string }
    expect(linkNode.url).toBe('https://example.com')
  })

  it('should parse tables into table node', async () => {
    const input = '| A | B |\n| --- | --- |\n| 1 | 2 |\n'
    const processor = unified().use(remarkParse).use(remarkGfm)
    const parsed = processor.parse(input)
    const ast = (await processor.run(parsed)) as Root

    const { visit } = await import('unist-util-visit')
    const tableNodes: unknown[] = []
    visit(ast, 'table', (node) => {
      tableNodes.push(node)
    })

    expect(tableNodes).toHaveLength(1)
  })

  it('without remark-gfm, task list items should NOT have checked property', async () => {
    const input = '- [ ] Incomplete task\n'
    const processor = unified().use(remarkParse)
    const parsed = processor.parse(input)
    const ast = (await processor.run(parsed)) as Root

    const { visit } = await import('unist-util-visit')
    const listItems: Array<{ checked: boolean | null }> = []
    visit(ast, 'listItem', (node) => {
      const li = node as ListItem
      listItems.push({ checked: li.checked })
    })

    expect(listItems).toHaveLength(1)
    // Without remark-gfm, checked should be null (not parsed as task list)
    expect(listItems[0].checked).toBeNull()
  })
})