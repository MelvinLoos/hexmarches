import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { remarkWikiLinks } from '~/src/presentation/markdown/remark-wikilinks'
import { slugifyTitle } from '~/src/core/domain/wiki-node'
import type { Root } from 'mdast'

// ─── Issue #30: Task 4 — Remark Plugin for Wiki-Links ──────────────
// AST transformation tests proving [[Node Title]] → NuxtLink AST structure.

describe('Issue #30: Remark Plugin for Wiki-Links', () => {
  it('should transform [[Node Title]] into html AST node with wiki-link tag', async () => {
    const input = 'Check out [[The Harpers]] for more info.'
    const processor = unified().use(remarkParse).use(remarkWikiLinks)
    const parsed = processor.parse(input)
    const ast = (await processor.run(parsed)) as Root

    const { visit } = await import('unist-util-visit')
    const htmlNodes: string[] = []
    visit(ast, 'html', (node: unknown) => {
      const n = node as { value: string }
      htmlNodes.push(n.value)
    })

    expect(htmlNodes).toHaveLength(1)
    expect(htmlNodes[0]).toBe('<wiki-link title="The Harpers"></wiki-link>')
    // Should NOT contain hardcoded /wiki/the_harpers URL
    expect(htmlNodes[0]).not.toContain('/wiki/the_harpers')
  })

  it('should transform multiple wiki-links into html AST nodes', async () => {
    const input = '[[Locations]] visited by [[NPCs]] are marked.'
    const processor = unified().use(remarkParse).use(remarkWikiLinks)
    const parsed = processor.parse(input)
    const ast = (await processor.run(parsed)) as Root

    const { visit } = await import('unist-util-visit')
    const htmlNodes: string[] = []
    visit(ast, 'html', (node: unknown) => {
      const n = node as { value: string }
      htmlNodes.push(n.value)
    })

    expect(htmlNodes).toHaveLength(2)
    expect(htmlNodes).toContain('<wiki-link title="Locations"></wiki-link>')
    expect(htmlNodes).toContain('<wiki-link title="NPCs"></wiki-link>')
  })

  it('should not transform regular text without [[ ]] brackets', async () => {
    const input = 'This is just regular text with [a normal link](https://example.com).'
    const processor = unified().use(remarkParse).use(remarkWikiLinks)
    const parsed = processor.parse(input)
    const ast = (await processor.run(parsed)) as Root

    const { visit } = await import('unist-util-visit')
    // Regular markdown links still create link AST nodes
    const linkNodes: unknown[] = []
    visit(ast, 'link', (node: unknown) => {
      linkNodes.push(node)
    })

    expect(linkNodes).toHaveLength(1)
    const linkNode = linkNodes[0] as { url: string }
    expect(linkNode.url).toBe('https://example.com')

    // No wiki-link html nodes
    const htmlNodes: string[] = []
    visit(ast, 'html', (node: unknown) => {
      const n = node as { value: string }
      if (n.value.includes('wiki-link')) htmlNodes.push(n.value)
    })
    expect(htmlNodes).toHaveLength(0)
  })

  it('should handle empty wiki-link gracefully', async () => {
    const input = 'Empty [[]] brackets should be ignored.'
    const processor = unified().use(remarkParse).use(remarkWikiLinks)
    const parsed = processor.parse(input)
    const ast = (await processor.run(parsed)) as Root

    const { visit } = await import('unist-util-visit')
    const htmlNodes: string[] = []
    visit(ast, 'html', (node: unknown) => {
      const n = node as { value: string }
      if (n.value.includes('wiki-link')) htmlNodes.push(n.value)
    })

    // No wiki-link should be generated for empty [[]]
    expect(htmlNodes).toHaveLength(0)
  })

  it('should map node titles correctly via slugifyTitle', () => {
    // Verify the slugification used by the plugin
    expect(slugifyTitle('The Harpers')).toBe('the_harpers')
    expect(slugifyTitle('Dark Forest!')).toBe('dark_forest')
    expect(slugifyTitle('NPC')).toBe('npc')
    expect(slugifyTitle('My Favorite Locations@123')).toBe('my_favorite_locations_123')
  })
})