import { describe, it, expect, beforeEach } from 'vitest'
import { WikiService, sanitizeMarkdown } from '~/core/application/wiki-service'
import type { WikiRepository, WikiNodeSearchResult } from '~/core/domain/wiki-repository'
import type { WikiNode, CreateWikiNodeInput } from '~/core/domain/wiki-node'

function createMockRepo(): WikiRepository {
  const store = new Map<string, WikiNode>()
  return {
    async createNode(input: CreateWikiNodeInput): Promise<WikiNode> {
      const node: WikiNode = {
        id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: input.title,
        content: input.content,
        path: input.path,
        parentId: input.parentId,
        createdAt: input.createdAt ?? new Date(),
        updatedAt: input.updatedAt ?? new Date(),
      }
      store.set(node.id, node)
      return node
    },
    async findById(id: string): Promise<WikiNode | null> {
      return store.get(id) ?? null
    },
    async findByPath(path: string): Promise<WikiNode | null> {
      for (const n of store.values()) {
        if (n.path === path) return n
      }
      return null
    },
    async getDescendants(path: string): Promise<WikiNode[]> {
      return [...store.values()].filter(n => n.path.startsWith(path))
    },
    async updateNode(id: string, updates: Partial<Pick<WikiNode, 'title' | 'content' | 'path'>>): Promise<WikiNode | null> {
      const existing = store.get(id)
      if (!existing) return null
      const updated = { ...existing, ...updates, updatedAt: new Date() }
      store.set(id, updated)
      return updated
    },
    async deleteNode(id: string): Promise<boolean> {
      return store.delete(id)
    },
    async search(query: string, limit?: number): Promise<WikiNodeSearchResult[]> {
      return []
    },
  }
}

// ─── Sanitize Markdown ────────────────────────────────────────────
describe('sanitizeMarkdown()', () => {
  it('should strip <script> tags entirely', () => {
    const input = '# Title\n<script>alert("xss")</script>\nSome content'
    const result = sanitizeMarkdown(input)
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('alert')
    expect(result).not.toContain('</script>')
  })

  it('should strip self-closing <script/> tags', () => {
    const input = '# Title\n<script src="evil.js" />\nContent'
    const result = sanitizeMarkdown(input)
    expect(result).not.toContain('<script')
    expect(result).not.toContain('evil.js')
  })

  it('should strip onerror event handlers', () => {
    const input = '<img src="x.jpg" onerror="alert(1)">'
    const result = sanitizeMarkdown(input)
    expect(result).not.toContain('onerror')
    expect(result).not.toContain('alert')
  })

  it('should strip onclick event handlers', () => {
    const input = '<a onclick="stealCookies()">click me</a>'
    const result = sanitizeMarkdown(input)
    expect(result).not.toContain('onclick')
    expect(result).not.toContain('stealCookies')
  })

  it('should strip onload and onmouseover', () => {
    const input = '<body onload="bad()"><div onmouseover="evil()">hi</div></body>'
    const result = sanitizeMarkdown(input)
    expect(result).not.toContain('onload')
    expect(result).not.toContain('onmouseover')
  })

  it('should strip javascript: protocol URLs', () => {
    const input = '<a href="javascript:alert(1)">click</a>'
    const result = sanitizeMarkdown(input)
    expect(result).not.toContain('javascript:')
  })

  it('should preserve legitimate markdown elements', () => {
    const input = '# Heading\n**bold** and *italic*\n- list item\n[link](https://example.com)'
    const result = sanitizeMarkdown(input)
    expect(result).toContain('# Heading')
    expect(result).toContain('**bold**')
    expect(result).toContain('*italic*')
    expect(result).toContain('- list item')
    expect(result).toContain('[link](https://example.com)')
  })

  it('should preserve MDC component syntax', () => {
    const input = '::handout{title="Secret Letter"}'
    const result = sanitizeMarkdown(input)
    expect(result).toContain('::handout')
  })

  it('should preserve safe HTML', () => {
    const input = '<p>Hello <em>World</em></p>'
    const result = sanitizeMarkdown(input)
    expect(result).toContain('<p>')
    expect(result).toContain('<em>')
  })

  it('should handle empty string', () => {
    expect(sanitizeMarkdown('')).toBe('')
  })

  it('should strip all dangerous content from malicious-only input', () => {
    const input = '<script>alert(1)</script>'
    const result = sanitizeMarkdown(input)
    expect(result.trim()).toBe('')
  })

  it('should strip iframe tags', () => {
    const input = '<iframe src="evil.com"></iframe>'
    const result = sanitizeMarkdown(input)
    expect(result).not.toContain('<iframe')
  })

  it('should return same string if nothing dangerous', () => {
    const input = 'Just plain markdown text without any HTML.'
    expect(sanitizeMarkdown(input)).toBe(input)
  })
// ─── WikiService Orchestration ──────────────────────────────────────
describe('WikiService', () => {
  let service: WikiService
  let repo: WikiRepository

  beforeEach(() => {
    repo = createMockRepo()
    service = new WikiService(repo)
  })

  describe('createNode()', () => {
    it('should sanitize markdown content before passing to repository', async () => {
      const node = await service.createNode({
        title: 'Test',
        content: '<script>alert("xss")</script># Real Content',
        path: 'test.section',
      })
      expect(node.content).not.toContain('<script>')
      expect(node.content).not.toContain('alert')
      expect(node.content).toContain('# Real Content')
    })

    it('should reject invalid ltree paths', async () => {
      await expect(
        service.createNode({ title: 'Bad', content: 'test', path: 'Invalid Path' })
      ).rejects.toThrow()
    })

    it('should create node via repository when input is valid', async () => {
      const node = await service.createNode({
        title: 'Valid',
        content: '# Valid Content',
        path: 'valid.path',
      })
      expect(node.title).toBe('Valid')
      expect(node.path).toBe('valid.path')
      expect(node.content).toBe('# Valid Content')
    })
  })

  describe('updateNode()', () => {
    it('should sanitize content before updating', async () => {
      const created = await service.createNode({
        title: 'Original', content: '# Original', path: 'test.node',
      })
      const updated = await service.updateNode(created.id, {
        content: '<img onerror="alert(1)" src=x># Safe Content',
      })
      expect(updated).not.toBeNull()
      expect(updated!.content).not.toContain('onerror')
      expect(updated!.content).toContain('# Safe Content')
    })

    it('should throw when updating with invalid path', async () => {
      const created = await service.createNode({
        title: 'Original', content: '# Original', path: 'test.node',
      })
      await expect(
        service.updateNode(created.id, { path: 'Invalid Path!' })
      ).rejects.toThrow()
    })

    it('should return null for nonexistent node', async () => {
      const result = await service.updateNode('nonexistent', { title: 'Nope' })
      expect(result).toBeNull()
    })
  })

  describe('getNodeTree()', () => {
    it('should fetch descendants via repository', async () => {
      await service.createNode({ title: 'Root', content: '# Root', path: 'root' })
      await service.createNode({ title: 'Child', content: '# Child', path: 'root.child' })
      const tree = await service.getNodeTree('root')
      expect(tree).toHaveLength(2)
    })

    it('should throw for invalid ltree path', async () => {
      await expect(
        service.getNodeTree('invalid..path')
      ).rejects.toThrow()
    })
  })

  describe('searchNodes()', () => {
    it('should delegate to repository search', async () => {
      const results = await service.searchNodes('test')
      expect(Array.isArray(results)).toBe(true)
    })
  })
})
})