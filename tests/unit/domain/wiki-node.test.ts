import { describe, it, expect } from 'vitest'
import {
  validateLtreePath,
  isValidLtreeSegment,
  type WikiNode,
  createWikiNode,
  LtreeValidationError,
} from '~/src/core/domain/wiki-node'

// ─── Issue #10: Task 1 — Wiki Node Entities & Ltree Validation ──────
// Acceptance Criteria:
//  - vitest suite passes with 100% coverage on path validation
//  - No framework dependencies used (pure TypeScript)

describe('Issue #10: Domain Layer — Wiki Node Entities & Ltree Validation', () => {
  // ─── Ltree Segment Validation ─────────────────────────────────────
  describe('isValidLtreeSegment()', () => {
    it('should accept valid lowercase alphanumeric segments', () => {
      expect(isValidLtreeSegment('campaign')).toBe(true)
      expect(isValidLtreeSegment('locations')).toBe(true)
      expect(isValidLtreeSegment('forest')).toBe(true)
      expect(isValidLtreeSegment('chapter1')).toBe(true)
      expect(isValidLtreeSegment('sub_section')).toBe(true)
      expect(isValidLtreeSegment('a')).toBe(true)
    })

    it('should reject segments with spaces', () => {
      expect(isValidLtreeSegment('campaign locations')).toBe(false)
      expect(isValidLtreeSegment(' leading')).toBe(false)
      expect(isValidLtreeSegment('trailing ')).toBe(false)
      expect(isValidLtreeSegment('mid dle')).toBe(false)
    })

    it('should reject segments with special characters', () => {
      expect(isValidLtreeSegment('campaign@loc')).toBe(false)
      expect(isValidLtreeSegment('loc#tion')).toBe(false)
      expect(isValidLtreeSegment('sec!ion')).toBe(false)
      expect(isValidLtreeSegment('path$name')).toBe(false)
      expect(isValidLtreeSegment('name%')).toBe(false)
      expect(isValidLtreeSegment('path^2')).toBe(false)
      expect(isValidLtreeSegment('part&two')).toBe(false)
      expect(isValidLtreeSegment('way*star')).toBe(false)
    })

    it('should reject segments with dots', () => {
      expect(isValidLtreeSegment('campaign.loc')).toBe(false)
      expect(isValidLtreeSegment('loc.ation')).toBe(false)
    })

    it('should reject segments with hyphens', () => {
      expect(isValidLtreeSegment('campaign-loc')).toBe(false)
      expect(isValidLtreeSegment('-leading')).toBe(false)
      expect(isValidLtreeSegment('trailing-')).toBe(false)
    })

    it('should reject uppercase characters', () => {
      expect(isValidLtreeSegment('Campaign')).toBe(false)
      expect(isValidLtreeSegment('LOCATIONS')).toBe(false)
      expect(isValidLtreeSegment('MixedCase')).toBe(false)
    })

    it('should reject empty segments', () => {
      expect(isValidLtreeSegment('')).toBe(false)
    })

    it('should reject non-string inputs', () => {
      expect(isValidLtreeSegment(undefined as unknown as string)).toBe(false)
      expect(isValidLtreeSegment(null as unknown as string)).toBe(false)
      expect(isValidLtreeSegment(123 as unknown as string)).toBe(false)
    })
  })

  // ─── Ltree Path Validation ────────────────────────────────────────
  describe('validateLtreePath()', () => {
    it('should return true for valid ltree paths', () => {
      expect(validateLtreePath('campaign')).toBe(true)
      expect(validateLtreePath('campaign.locations')).toBe(true)
      expect(validateLtreePath('campaign.locations.forest')).toBe(true)
      expect(validateLtreePath('campaign.chapters.chapter1.act1')).toBe(true)
      expect(validateLtreePath('a.b.c.d.e')).toBe(true)
      expect(validateLtreePath('root')).toBe(true)
    })

    it('should return true for deeply nested valid paths', () => {
      expect(validateLtreePath('a.b.c.d.e.f.g.h.i.j')).toBe(true)
    })

    it('should return false for paths with spaces', () => {
      expect(validateLtreePath('campaign .locations')).toBe(false)
      expect(validateLtreePath('campaign.locations .forest')).toBe(false)
      expect(validateLtreePath('campaign. locations')).toBe(false)
    })

    it('should return false for paths with special characters', () => {
      expect(validateLtreePath('campaign@locations')).toBe(false)
      expect(validateLtreePath('campaign.locations#forest')).toBe(false)
      expect(validateLtreePath('campaign!section')).toBe(false)
    })

    it('should return false for empty segments (double dots)', () => {
      expect(validateLtreePath('campaign..locations')).toBe(false)
      expect(validateLtreePath('campaign.locations..forest')).toBe(false)
      expect(validateLtreePath('..campaign')).toBe(false)
    })

    it('should return false for leading dot', () => {
      expect(validateLtreePath('.campaign')).toBe(false)
      expect(validateLtreePath('.campaign.locations')).toBe(false)
    })

    it('should return false for trailing dot', () => {
      expect(validateLtreePath('campaign.')).toBe(false)
      expect(validateLtreePath('campaign.locations.')).toBe(false)
    })

    it('should return false for uppercase characters', () => {
      expect(validateLtreePath('Campaign.Locations')).toBe(false)
      expect(validateLtreePath('campaign.Locations')).toBe(false)
      expect(validateLtreePath('CAMPAIGN.LOCATIONS')).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(validateLtreePath('')).toBe(false)
    })

    it('should return false for whitespace-only strings', () => {
      expect(validateLtreePath('   ')).toBe(false)
    })

    it('should return false for non-string inputs', () => {
      expect(validateLtreePath(undefined as unknown as string)).toBe(false)
      expect(validateLtreePath(null as unknown as string)).toBe(false)
      expect(validateLtreePath(123 as unknown as string)).toBe(false)
      expect(validateLtreePath({} as unknown as string)).toBe(false)
    })
  })
// ─── WikiNode Interface ───────────────────────────────────────────
  describe('WikiNode interface', () => {
    it('should accept a node with all required fields', () => {
      const node: WikiNode = {
        id: 'node-1',
        title: 'Dark Forest',
        content: '# Dark Forest\n\nA spooky forest.',
        path: 'campaign.locations.forest',
        createdAt: new Date('2025-06-01'),
        updatedAt: new Date('2025-06-15'),
      }
      expect(node.id).toBe('node-1')
      expect(node.title).toBe('Dark Forest')
      expect(node.content).toBe('# Dark Forest\n\nA spooky forest.')
      expect(node.path).toBe('campaign.locations.forest')
      expect(node.createdAt).toBeInstanceOf(Date)
      expect(node.updatedAt).toBeInstanceOf(Date)
    })

    it('should allow optional parentId and children fields', () => {
      const node: WikiNode = {
        id: 'node-2',
        title: 'Locations',
        content: '## Root locations',
        path: 'campaign.locations',
        parentId: 'node-root',
        children: ['node-1', 'node-3'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      expect(node.parentId).toBe('node-root')
      expect(node.children).toEqual(['node-1', 'node-3'])
    })

    it('should enforce type safety on path as string', () => {
      const node: WikiNode = {
        id: 'node-3',
        title: 'Test',
        content: 'test',
        path: 'valid.path',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      expect(typeof node.path).toBe('string')
    })
  })

  // ─── WikiNode Factory ─────────────────────────────────────────────
  describe('createWikiNode()', () => {
    it('should create a WikiNode with validated path', () => {
      const node = createWikiNode({
        title: 'Dark Forest',
        content: '# Dark Forest',
        path: 'campaign.locations.forest',
      })

      expect(node.id).toBeDefined()
      expect(typeof node.id).toBe('string')
      expect(node.id).toContain('node-')
      expect(node.title).toBe('Dark Forest')
      expect(node.content).toBe('# Dark Forest')
      expect(node.path).toBe('campaign.locations.forest')
      expect(node.createdAt).toBeInstanceOf(Date)
      expect(node.updatedAt).toBeInstanceOf(Date)
    })

    it('should reject invalid ltree paths at the factory level', () => {
      expect(() =>
        createWikiNode({
          title: 'Bad Node',
          content: 'test',
          path: 'campaign..locations',
        })
      ).toThrow(LtreeValidationError)

      expect(() =>
        createWikiNode({
          title: 'Bad Node',
          content: 'test',
          path: 'Campaign Locations',
        })
      ).toThrow(LtreeValidationError)

      expect(() =>
        createWikiNode({
          title: 'Bad Node',
          content: 'test',
          path: '',
        })
      ).toThrow(LtreeValidationError)
    })

    it('should accept an optional parentId', () => {
      const node = createWikiNode({
        title: 'Child',
        content: 'child content',
        path: 'campaign.locations.forest.cave',
        parentId: 'node-parent',
      })

      expect(node.parentId).toBe('node-parent')
      expect(node.path).toBe('campaign.locations.forest.cave')
    })

    it('should set createdAt and updatedAt to now by default', () => {
      const before = new Date()
      const node = createWikiNode({
        title: 'Fresh',
        content: 'test',
        path: 'fresh',
      })
      const after = new Date()

      expect(node.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(node.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
      expect(node.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(node.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it('should allow overriding dates', () => {
      const pastDate = new Date('2024-01-01')
      const node = createWikiNode({
        title: 'Historic',
        content: 'old content',
        path: 'historic',
        createdAt: pastDate,
        updatedAt: pastDate,
      })

      expect(node.createdAt).toBe(pastDate)
      expect(node.updatedAt).toBe(pastDate)
    })
  })

  // ─── Clean Architecture Enforcement ───────────────────────────────
  describe('Clean Architecture compliance', () => {
    it('should not import from Nuxt, Vue, or Supabase in the domain file', async () => {
      const domainPath = '../../../src/core/domain/wiki-node'
      const mod = await import(domainPath)
      expect(mod).toBeDefined()
      expect(mod.validateLtreePath).toBeDefined()
      expect(mod.isValidLtreeSegment).toBeDefined()
      expect(mod.createWikiNode).toBeDefined()
    })
  })
})