import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { SupabaseWikiRepository } from '~/src/infrastructure/supabase/wiki-repository'
import { createSupabaseAdapter } from '~/src/infrastructure/supabase/adapter'
import { createClient } from '@supabase/supabase-js'
import type { WikiNode } from '~/src/core/domain/wiki-node'

// ─── Issue #11: Task 2 — Supabase Wiki Adapter & FTS ───────────────
// CRUD operations, tree-fetching by ltree paths, Full-Text Search queries

const SUPABASE_URL = 'http://localhost:54321'
const SUPABASE_KEY = 'test-anon-key'

const mockNode: WikiNode = {
  id: 'node-1',
  title: 'Dark Forest',
  content: '# Dark Forest\n\nA spooky forest.',
  path: 'campaign.locations.forest',
  createdAt: new Date('2025-06-01'),
  updatedAt: new Date('2025-06-15'),
}

const mockNode2: WikiNode = {
  id: 'node-2',
  title: 'Elder Cave',
  content: '## Elder Cave\n\nDeep within the forest.',
  path: 'campaign.locations.forest.cave',
  parentId: 'node-1',
  createdAt: new Date('2025-06-02'),
  updatedAt: new Date('2025-06-16'),
}

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function makeRepository(): SupabaseWikiRepository {
  const client = createClient(SUPABASE_URL, SUPABASE_KEY)
  const adapter = createSupabaseAdapter(client)
  return new SupabaseWikiRepository(adapter)
}

describe('Issue #11: Infrastructure — Supabase Wiki Adapter & FTS', () => {
  // ─── Create Node ──────────────────────────────────────────────────
  describe('createNode()', () => {
    it('should create a wiki node and return it', async () => {
      server.use(
        http.post(`${SUPABASE_URL}/rest/v1/wiki_nodes`, async ({ request }) => {
          const body = await request.json() as Record<string, unknown>
          expect(body.title).toBe('Dark Forest')
          expect(body.path).toBe('campaign.locations.forest')
          return HttpResponse.json({ ...mockNode, ...body }, { status: 201 })
        })
      )

      const repo = makeRepository()
      const node = await repo.createNode({
        title: 'Dark Forest',
        content: '# Dark Forest\n\nA spooky forest.',
        path: 'campaign.locations.forest',
      })

      expect(node.title).toBe('Dark Forest')
      expect(node.path).toBe('campaign.locations.forest')
    })
  })

  // ─── Find by ID ──────────────────────────────────────────────────
  describe('findById()', () => {
    it('should return a node when found by ID', async () => {
      server.use(
        http.get(`${SUPABASE_URL}/rest/v1/wiki_nodes`, ({ request }) => {
          const url = new URL(request.url)
          if (url.searchParams.get('id') === 'eq.node-1') {
            return HttpResponse.json([mockNode])
          }
          return HttpResponse.json([])
        })
      )

      const repo = makeRepository()
      const node = await repo.findById('node-1')
      expect(node).not.toBeNull()
      expect(node!.id).toBe('node-1')
      expect(node!.title).toBe('Dark Forest')
    })

    it('should return null when node not found', async () => {
      server.use(
        http.get(`${SUPABASE_URL}/rest/v1/wiki_nodes`, () => HttpResponse.json([]))
      )

      const repo = makeRepository()
      const node = await repo.findById('nonexistent')
      expect(node).toBeNull()
    })
  })

  // ─── Find by Path ────────────────────────────────────────────────
  describe('findByPath()', () => {
    it('should find a node by exact ltree path', async () => {
      server.use(
        http.get(`${SUPABASE_URL}/rest/v1/wiki_nodes`, ({ request }) => {
          const url = new URL(request.url)
          if (url.searchParams.get('path') === 'eq.campaign.locations.forest') {
            return HttpResponse.json([mockNode])
          }
          return HttpResponse.json([])
        })
      )

      const repo = makeRepository()
      const node = await repo.findByPath('campaign.locations.forest')
      expect(node).not.toBeNull()
      expect(node!.path).toBe('campaign.locations.forest')
    })
})

  // ─── Get Descendants (Tree Fetch) ────────────────────────────────
  describe('getDescendants()', () => {
    it('should fetch all descendants via ltree prefix matching', async () => {
      server.use(
        http.get(`${SUPABASE_URL}/rest/v1/wiki_nodes`, ({ request }) => {
          const url = new URL(request.url)
          if (url.searchParams.get('path') === 'like.campaign.locations%') {
            return HttpResponse.json([mockNode, mockNode2])
          }
          return HttpResponse.json([])
        })
      )

      const repo = makeRepository()
      const nodes = await repo.getDescendants('campaign.locations')
      expect(nodes).toHaveLength(2)
      expect(nodes[0].path).toBe('campaign.locations.forest')
      expect(nodes[1].path).toBe('campaign.locations.forest.cave')
    })

    it('should return empty array when no descendants exist', async () => {
      server.use(
        http.get(`${SUPABASE_URL}/rest/v1/wiki_nodes`, () => HttpResponse.json([]))
      )
      const repo = makeRepository()
      const nodes = await repo.getDescendants('nonexistent.path')
      expect(nodes).toHaveLength(0)
    })
  })

  // ─── Update Node ─────────────────────────────────────────────────
  describe('updateNode()', () => {
    it('should update a node and return the updated record', async () => {
      server.use(
        http.patch(`${SUPABASE_URL}/rest/v1/wiki_nodes`, async ({ request }) => {
          const url = new URL(request.url)
          expect(url.searchParams.get('id')).toBe('eq.node-1')
          const body = await request.json() as Record<string, unknown>
          return HttpResponse.json([{ ...mockNode, ...body, updatedAt: new Date().toISOString() }])
        })
      )

      const repo = makeRepository()
      const node = await repo.updateNode('node-1', { title: 'Updated Forest' })
      expect(node).not.toBeNull()
      expect(node!.title).toBe('Updated Forest')
    })

    it('should return null when updating nonexistent node', async () => {
      server.use(
        http.patch(`${SUPABASE_URL}/rest/v1/wiki_nodes`, () => HttpResponse.json([]))
      )
      const repo = makeRepository()
      const node = await repo.updateNode('nonexistent', { title: 'Nope' })
      expect(node).toBeNull()
    })
  })

  // ─── Delete Node ─────────────────────────────────────────────────
  describe('deleteNode()', () => {
    it('should delete a node and return true', async () => {
      server.use(
        http.delete(`${SUPABASE_URL}/rest/v1/wiki_nodes`, ({ request }) => {
          const url = new URL(request.url)
          expect(url.searchParams.get('id')).toBe('eq.node-1')
          return HttpResponse.json([{ id: 'node-1' }])
        })
      )
      const repo = makeRepository()
      const result = await repo.deleteNode('node-1')
      expect(result).toBe(true)
    })

    it('should return false when deleting nonexistent node', async () => {
      server.use(
        http.delete(`${SUPABASE_URL}/rest/v1/wiki_nodes`, () => HttpResponse.json([]))
      )
      const repo = makeRepository()
      const result = await repo.deleteNode('nonexistent')
      expect(result).toBe(false)
    })
  })

  // ─── Full-Text Search ────────────────────────────────────────────
  describe('search()', () => {
    const searchResults = [
      {
        id: 'node-1', title: 'Dark Forest', content: '# Dark Forest',
        path: 'campaign.locations.forest',
        created_at: '2025-06-01T00:00:00Z', updated_at: '2025-06-15T00:00:00Z',
        rank: 0.8, headline: 'A <b>spooky</b> forest.',
      },
      {
        id: 'node-2', title: 'Spooky Cave', content: '## Cave',
        path: 'campaign.locations.forest.cave',
        created_at: '2025-06-02T00:00:00Z', updated_at: '2025-06-16T00:00:00Z',
        rank: 0.5, headline: 'A <b>spooky</b> cave.',
      },
    ]

    it('should perform FTS and return ranked results', async () => {
      server.use(
        http.post(`${SUPABASE_URL}/rest/v1/rpc/search_wiki`, async ({ request }) => {
          const body = await request.json() as Record<string, unknown>
          expect(body.search_query).toBe('spooky')
          return HttpResponse.json(searchResults)
        })
      )

      const repo = makeRepository()
      const results = await repo.search('spooky', 10)
      expect(results).toHaveLength(2)
      expect(results[0].rank).toBe(0.8)
      expect(results[0].headline).toBe('A <b>spooky</b> forest.')
      expect(results[0].node.title).toBe('Dark Forest')
      expect(results[1].node.title).toBe('Spooky Cave')
    })

    it('should return empty array for no matches', async () => {
      server.use(
        http.post(`${SUPABASE_URL}/rest/v1/rpc/search_wiki`, () => HttpResponse.json([]))
      )
      const repo = makeRepository()
      const results = await repo.search('nonexistent12345')
      expect(results).toHaveLength(0)
    })
  })
})