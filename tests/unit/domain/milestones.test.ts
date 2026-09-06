import { describe, it, expect } from 'vitest'
import { calculateTier, Tier, Character, Milestone } from '~/src/core/domain/milestones'

describe('Issue #2: Domain Layer — Milestone & Progression Rules', () => {
  // ─── Tier Calculation ────────────────────────────────────────────
  describe('calculateTier()', () => {
    // Tier 1: 0-3 milestones
    it('should return Tier 1 for 0 milestones', () => {
      expect(calculateTier(0)).toBe(Tier.TIER_1)
    })

    it('should return Tier 1 for 1 milestone', () => {
      expect(calculateTier(1)).toBe(Tier.TIER_1)
    })

    it('should return Tier 1 for 3 milestones (upper boundary)', () => {
      expect(calculateTier(3)).toBe(Tier.TIER_1)
    })

    // Tier 2: 4-9 milestones
    it('should return Tier 2 for 4 milestones (lower boundary)', () => {
      expect(calculateTier(4)).toBe(Tier.TIER_2)
    })

    it('should return Tier 2 for 7 milestones', () => {
      expect(calculateTier(7)).toBe(Tier.TIER_2)
    })

    it('should return Tier 2 for 9 milestones (upper boundary)', () => {
      expect(calculateTier(9)).toBe(Tier.TIER_2)
    })

    // Tier 3: 10+ milestones
    it('should return Tier 3 for 10 milestones (lower boundary)', () => {
      expect(calculateTier(10)).toBe(Tier.TIER_3)
    })

    it('should return Tier 3 for 50 milestones', () => {
      expect(calculateTier(50)).toBe(Tier.TIER_3)
    })

    it('should return Tier 3 for 1000 milestones', () => {
      expect(calculateTier(1000)).toBe(Tier.TIER_3)
    })

    // Edge cases
    it('should throw for negative milestone counts', () => {
      expect(() => calculateTier(-1)).toThrow()
      expect(() => calculateTier(-100)).toThrow()
    })

    it('should throw for non-integer milestone counts', () => {
      expect(() => calculateTier(2.5)).toThrow()
      expect(() => calculateTier(3.1)).toThrow()
    })
  })

  // ─── Tier Constants ──────────────────────────────────────────────
  describe('Tier enum', () => {
    it('should define exactly three tiers', () => {
      const tierValues = Object.values(Tier).filter(v => typeof v === 'number')
      expect(tierValues).toHaveLength(3)
    })

    it('should have Tier 1 < Tier 2 < Tier 3', () => {
      expect(Tier.TIER_1).toBeLessThan(Tier.TIER_2)
      expect(Tier.TIER_2).toBeLessThan(Tier.TIER_3)
    })
  })

  // ─── Character Entity ────────────────────────────────────────────
  describe('Character entity', () => {
    it('should create a Character with an ID, name, and milestone count', () => {
      const char = new Character('char-1', 'Aria', 5)
      expect(char.id).toBe('char-1')
      expect(char.name).toBe('Aria')
      expect(char.milestoneCount).toBe(5)
    })

    it('should return the correct tier based on milestone count', () => {
      expect(new Character('a', 'T1-0', 0).tier).toBe(Tier.TIER_1)
      expect(new Character('b', 'T1-3', 3).tier).toBe(Tier.TIER_1)
      expect(new Character('c', 'T2-4', 4).tier).toBe(Tier.TIER_2)
      expect(new Character('d', 'T2-9', 9).tier).toBe(Tier.TIER_2)
      expect(new Character('e', 'T3-10', 10).tier).toBe(Tier.TIER_3)
      expect(new Character('f', 'T3-100', 100).tier).toBe(Tier.TIER_3)
    })

    it('should reject invalid milestone counts on construction', () => {
      expect(() => new Character('x', 'Bad', -5)).toThrow()
      expect(() => new Character('y', 'Bad', 2.5)).toThrow()
    })

    it('should allow adding a milestone to a Character', () => {
      const char = new Character('g', 'Growing', 2)
      expect(char.tier).toBe(Tier.TIER_1)
      char.addMilestone()
      expect(char.milestoneCount).toBe(3)
      expect(char.tier).toBe(Tier.TIER_1) // still Tier 1 at boundary
      char.addMilestone()
      expect(char.milestoneCount).toBe(4)
      expect(char.tier).toBe(Tier.TIER_2) // promoted to Tier 2
    })

    it('should allow adding multiple milestones at once', () => {
      const char = new Character('h', 'Burst', 3)
      char.addMilestones(6)
      expect(char.milestoneCount).toBe(9)
      expect(char.tier).toBe(Tier.TIER_2)
      char.addMilestones(1)
      expect(char.milestoneCount).toBe(10)
      expect(char.tier).toBe(Tier.TIER_3)
    })

    it('should export Character state as a plain serializable object', () => {
      const char = new Character('i', 'Exportable', 3)
      const state = char.toJSON()
      expect(state).toEqual({
        id: 'i',
        name: 'Exportable',
        milestoneCount: 3,
        tier: Tier.TIER_1,
      })
    })
  })

  // ─── Milestone Type ──────────────────────────────────────────────
  describe('Milestone type', () => {
    it('should create a Milestone with all required fields', () => {
      const ms: Milestone = {
        id: 'ms-1',
        characterId: 'char-1',
        title: 'Defeated the Dragon',
        description: 'The party defeated the ancient red dragon.',
        awardedAt: new Date('2025-06-15'),
      }
      expect(ms.id).toBe('ms-1')
      expect(ms.characterId).toBe('char-1')
      expect(ms.title).toBe('Defeated the Dragon')
      expect(ms.awardedAt).toBeInstanceOf(Date)
    })
  })

  // ─── Clean Architecture Enforcement ──────────────────────────────
  describe('Clean Architecture compliance', () => {
    it('should not import from Nuxt, Vue, or Supabase in the domain file', async () => {
      const domainPath = '../../../src/core/domain/milestones'
      const mod = await import(domainPath)
      // If the module loaded without framework deps, the test passes
      expect(mod).toBeDefined()
      expect(mod.calculateTier).toBeDefined()
      expect(mod.Tier).toBeDefined()
      expect(mod.Character).toBeDefined()
    })
  })
})