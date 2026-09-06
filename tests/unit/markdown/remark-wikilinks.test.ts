import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { remarkWikiLinks } from '~/src/presentation/markdown/remark-wikilinks'
import { slugifyTitle } from '~/src/core/domain/wiki-node'
import type { Root } from 'mdast'

// ─── Issue #30: Task 4 — Remark Plugin for Wiki-Links ──────────────
// AST transformation tests proving [[Node Title]] → NuxtLink AST structure.

describe('Issue #30: Remark Plugin for Wiki-Links', () => {
  it('should transform [[Node Title]] into a link node', async () => {
    const input = 'Check out [[The Harpers]] for more info.'
    const processor = unified().use(remarkParse).use(remarkWikiLinks)
    const parsed = processor.parse(input)
    const ast = (await processor.run(parsed)) as Root

    // Walk the AST to find the transformed wiki-link node
    const { visit } = await import('unist-util-visit')
    const linkNodes: unknown[] = []
    visit(ast, 'link', (node: unknown) => {
      linkNodes.push(node)
    })

    expect(linkNodes).toHaveLength(1)
    const linkNode = linkNodes[0] as { url: string; title?: string; children?: Array<{ value: string }> }
    expect(linkNode.url).toBe('/wiki/the_harpers')
    expect(linkNode.title).toBe('The Harpers')
  })

  it('should transform multiple wiki-links in the same paragraph', async () => {
    const input = '[[Locations]] visited by [[NPCs]] are marked.'
    const processor = unified().use(remarkParse).use(remarkWikiLinks)
    const parsed = processor.parse(input)
    const ast = (await processor.run(parsed)) as Root

    const { visit } = await import('unist-util-visit')
    const linkNodes: unknown[] = []
    visit(ast, 'link', (node: unknown) => {
      linkNodes.push(node)
    })

    expect(linkNodes).toHaveLength(2)
    const urls = (linkNodes as Array<{ url: string }>).map((n) => n.url)
    expect(urls).toContain('/wiki/locations')
    expect(urls).toContain('/wiki/npcs')
  })

  it('should not transform regular text without [[ ]] brackets', async () => {
    const input = 'This is just regular text with [a normal link](https://example.com).'
    const processor = unified().use(remarkParse).use(remarkWikiLinks)
    const parsed = processor.parse(input)
    const ast = (await processor.run(parsed)) as Root

    const { visit } = await import('unist-util-visit')
    const linkNodes: unknown[] = []
    visit(ast, 'link', (node: unknown) => {
      linkNodes.push(node)
    })

    // The regular markdown link should remain as-is (1 link)
    expect(linkNodes).toHaveLength(1)
    const linkNode = linkNodes[0] as { url: string }
    expect(linkNode.url).toBe('https://example.com')
  })

  it('should handle empty wiki-link gracefully', async () => {
    const input = 'Empty [[]] brackets should be ignored.'
    const processor = unified().use(remarkParse).use(remarkWikiLinks)
    const parsed = processor.parse(input)
    const ast = (await processor.run(parsed)) as Root

    const { visit } = await import('unist-util-visit')
    const linkNodes: unknown[] = []
    visit(ast, 'link', (node: unknown) => {
      linkNodes.push(node)
    })

    // No links should be generated for empty brackets
    expect(linkNodes).toHaveLength(0)
  })

  it('should map node titles correctly via slugifyTitle', () => {
    // Verify the slugification used by the plugin
    expect(slugifyTitle('The Harpers')).toBe('the_harpers')
    expect(slugifyTitle('Dark Forest!')).toBe('dark_forest')
    expect(slugifyTitle('NPC')).toBe('npc')
    expect(slugifyTitle('My Favorite Locations@123')).toBe('my_favorite_locations_123')
  })
})