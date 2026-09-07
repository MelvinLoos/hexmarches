import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { SupabaseWikiRepository } from '~/src/infrastructure/supabase/wiki-repository'
import { createSupabaseAdapter } from '~/src/infrastructure/supabase/adapter'
import type { WikiNode } from '~/src/core/domain/wiki-node'

const SUPABASE_URL = 'http://127.0.0.1:54321'
const ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
const SERVICE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

let adminClient: ReturnType<typeof createClient>
let repo: SupabaseWikiRepository
let forestId: string
let caveId: string
let gandalfId: string

beforeAll(() => {
  adminClient = createClient(SUPABASE_URL, SERVICE_KEY)
  const client = createClient(SUPABASE_URL, ANON_KEY)
  const adapter = createSupabaseAdapter(client)
  repo = new SupabaseWikiRepository(adapter)
})

beforeEach(async () => {
  await adminClient.from('wiki_nodes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  const { data } = await adminClient.from('wiki_nodes').insert([
    { title: 'Campaign', content: 'Root node.', path: 'campaign', entity_type: 'GENERAL' },
    { title: 'Locations', content: 'All locations.', path: 'campaign.locations', entity_type: 'GENERAL' },
    { title: 'Dark Forest', content: 'A spooky forest filled with danger.', path: 'campaign.locations.forest', entity_type: 'LOCATION', cover_image_url: 'https://cdn.example.com/forest.jpg' },
    { title: 'Spooky Cave', content: 'A spooky cave deep underground.', path: 'campaign.locations.forest.cave', entity_type: 'LOCATION' },
    { title: 'Factions', content: 'All factions.', path: 'campaign.factions', entity_type: 'GENERAL' },
    { title: 'NPCs', content: 'All NPCs. See also [[Dark Forest]] for location context.', path: 'campaign.npcs', entity_type: 'GENERAL' },
    { title: 'Gandalf', content: 'A wise wizard who often visits [[Dark Forest]].', path: 'campaign.npcs.gandalf', entity_type: 'NPC', cover_image_url: 'https://cdn.example.com/gandalf.jpg' },
    { title: 'Session 4 Notes', content: 'Party explored [[Dark Forest]] and found [[Spooky Cave]]. Talked to [[Gandalf]] about the [[The Harpers]].', path: 'campaign.sessions.session4', entity_type: 'GENERAL' },
  ]).select()
  const nodes = data as any[]
  forestId = nodes.find((n: any) => n.path === 'campaign.locations.forest')!.id
  caveId = nodes.find((n: any) => n.path === 'campaign.locations.forest.cave')!.id
  gandalfId = nodes.find((n: any) => n.path === 'campaign.npcs.gandalf')!.id
})

afterAll(async () => {
  await adminClient.from('wiki_nodes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
})

describe('Issue #11: Infrastructure — Supabase Wiki Adapter & FTS', () => {
  describe('createNode()', () => {
    it('should create a wiki node and return it', async () => {
      const node = await repo.createNode({
        title: 'Dark Forest',
        content: '# Dark Forest\n\nA spooky forest.',
        path: 'campaign.locations.forest',
      })
      expect(node.title).toBe('Dark Forest')
      expect(node.path).toBe('campaign.locations.forest')
      expect(node.id).toBeTruthy()
      expect(node.createdAt).toBeInstanceOf(Date)
    })
  })

  describe('findById()', () => {
    it('should return a node when found by ID', async () => {
      const node = await repo.findById(forestId)
      expect(node).not.toBeNull()
      expect(node!.id).toBe(forestId)
      expect(node!.title).toBe('Dark Forest')
    })
    it('should return null when node not found', async () => {
      const node = await repo.findById('00000000-0000-0000-0000-000000000000')
      expect(node).toBeNull()
    })
  })

  describe('findByPath()', () => {
    it('should return a node by exact ltree path', async () => {
      const node = await repo.findByPath('campaign.locations.forest')
      expect(node).not.toBeNull()
      expect(node!.title).toBe('Dark Forest')
      expect(node!.path).toBe('campaign.locations.forest')
    })
    it('should return null for non-existent path', async () => {
      const node = await repo.findByPath('campaign.nonexistent.xyz')
      expect(node).toBeNull()
    })
  })

  describe('getDescendants()', () => {
    it('should return all descendants of a path', async () => {
      const descendants = await repo.getDescendants('campaign.locations')
      expect(descendants.length).toBeGreaterThanOrEqual(2)
      const paths = descendants.map(d => d.path)
      expect(paths).toContain('campaign.locations.forest')
      expect(paths).toContain('campaign.locations.forest.cave')
    })
  })

  describe('updateNode()', () => {
    it('should update a node and return it', async () => {
      const updated = await repo.updateNode(forestId, { title: 'Misty Forest', content: 'Updated content.' })
      expect(updated).not.toBeNull()
      expect(updated!.title).toBe('Misty Forest')
      expect(updated!.content).toBe('Updated content.')
      expect(updated!.id).toBe(forestId)
    })
    it('should return null for non-existent node', async () => {
      const result = await repo.updateNode('00000000-0000-0000-0000-000000000000', { title: 'Nope' })
      expect(result).toBeNull()
    })
  })

  describe('deleteNode()', () => {
    it('should delete a node and return true', async () => {
      const result = await repo.deleteNode(caveId)
      expect(result).toBe(true)
      const node = await repo.findById(caveId)
      expect(node).toBeNull()
    })
    it('should return false for non-existent node', async () => {
      const result = await repo.deleteNode('00000000-0000-0000-0000-000000000000')
      expect(result).toBe(false)
    })
  })

  describe('entity_type and cover_image_url fields', () => {
    it('should update coverImageUrl on an existing node', async () => {
      const updated = await repo.updateNode(forestId, { coverImageUrl: 'https://cdn.example.com/new.jpg' })
      expect(updated).not.toBeNull()
      expect(updated!.coverImageUrl).toBe('https://cdn.example.com/new.jpg')
    })
    it('should find a node with entityType from the database', async () => {
      const node = await repo.findById(gandalfId)
      expect(node).not.toBeNull()
      expect(node!.coverImageUrl).toBe('https://cdn.example.com/gandalf.jpg')
      expect(node!.entityType).toBe('NPC')
    })
    it('should update entityType on an existing node', async () => {
      const node = await repo.updateNode(gandalfId, { entityType: 'GENERAL' as WikiNode['entityType'] })
      expect(node).not.toBeNull()
      expect(node!.entityType).toBe('GENERAL')
    })
  })

  describe('search()', () => {
    it('should perform FTS and return ranked results', async () => {
      const results = await repo.search('spooky', 10)
      expect(results.length).toBeGreaterThanOrEqual(1)
      const titles = results.map(r => r.node.title)
      expect(titles).toContain('Dark Forest')
      expect(titles).toContain('Spooky Cave')
      expect(results[0].rank).toBeGreaterThan(0)
      expect(results[0].headline).toContain('<b>')
    })
    it('should return empty array for no matches', async () => {
      const results = await repo.search('nonexistent12345xyz')
      expect(results).toHaveLength(0)
    })
  })

  // ── Issue #40: Dynamic Backlinks ─────────────────────────────────
  describe('findInboundReferences()', () => {
    it('should find nodes that reference a given title via [[wikilinks]]', async () => {
      const refs = await repo.findInboundReferences('Dark Forest')
      expect(refs.length).toBeGreaterThanOrEqual(2)
      const titles = refs.map(r => r.title)
      // NPCs, Gandalf, and Session 4 Notes all reference [[Dark Forest]]
      expect(titles).toContain('NPCs')
      expect(titles).toContain('Gandalf')
      expect(titles).toContain('Session 4 Notes')
    })

    it('should find nodes referencing Spooky Cave', async () => {
      const refs = await repo.findInboundReferences('Spooky Cave')
      expect(refs.length).toBeGreaterThanOrEqual(1)
      expect(refs.map(r => r.title)).toContain('Session 4 Notes')
    })

    it('should return empty array for title with no references', async () => {
      const refs = await repo.findInboundReferences('Nonexistent Page')
      expect(refs).toHaveLength(0)
    })
  })
})
