import { describe, it, expect } from 'vitest'
import {
  HexCoord,
  hexDistance,
  hexNeighbors,
  hexEquals,
  hexToKey,
  createHexCoord,
  VttPayload,
  VttPayloadType,
  ViewTransform,
  FogOfWarState,
  TokenPosition,
  createVttPayload,
  validateVttPayload,
} from '~/src/core/domain/vtt'

describe('Issue #3: Domain Layer — VTT Payload & Hex Math Definitions', () => {
  describe('HexCoord', () => {
    it('should create a hex coordinate with q and r', () => {
      const hex = createHexCoord(0, 0)
      expect(hex.q).toBe(0)
      expect(hex.r).toBe(0)
    })
    it('should create a hex coordinate with negative values', () => {
      const hex = createHexCoord(-3, 5)
      expect(hex.q).toBe(-3)
      expect(hex.r).toBe(5)
    })
    it('should reject non-integer q values', () => {
      expect(() => createHexCoord(1.5, 0)).toThrow()
    })
    it('should reject non-integer r values', () => {
      expect(() => createHexCoord(0, 2.7)).toThrow()
    })
  })

  describe('hexDistance()', () => {
    it('should return 0 for the same hex', () => {
      const a = createHexCoord(5, 3)
      expect(hexDistance(a, a)).toBe(0)
    })
    it('should return 1 for an adjacent hex (q+1)', () => {
      expect(hexDistance(createHexCoord(0, 0), createHexCoord(1, 0))).toBe(1)
    })
    it('should return 1 for an adjacent hex (r+1)', () => {
      expect(hexDistance(createHexCoord(0, 0), createHexCoord(0, 1))).toBe(1)
    })
    it('should return 1 for an adjacent hex (diagonal)', () => {
      expect(hexDistance(createHexCoord(0, 0), createHexCoord(1, -1))).toBe(1)
    })
    it('should return correct distance for non-adjacent hexes', () => {
      const a = createHexCoord(0, 0)
      const b = createHexCoord(3, -2)
      expect(hexDistance(a, b)).toBe(3)
    })
    it('should return correct distance for large coordinates', () => {
      const a = createHexCoord(-5, 10)
      const b = createHexCoord(7, -3)
      expect(hexDistance(a, b)).toBe(13)
    })
    it('should be commutative', () => {
      const a = createHexCoord(2, -4)
      const b = createHexCoord(-1, 7)
      expect(hexDistance(a, b)).toBe(hexDistance(b, a))
    })
  })

  describe('hexNeighbors()', () => {
    it('should return exactly 6 neighbors', () => {
      const center = createHexCoord(0, 0)
      expect(hexNeighbors(center)).toHaveLength(6)
    })
    it('should return all adjacent hexes', () => {
      const center = createHexCoord(0, 0)
      const neighbors = hexNeighbors(center)
      const expectedDirs = [
        { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
      ]
      for (const dir of expectedDirs) {
        const expected = createHexCoord(center.q + dir.q, center.r + dir.r)
        expect(neighbors.some(n => hexEquals(n, expected))).toBe(true)
      }
    })
    it('should work for non-origin hexes', () => {
      const center = createHexCoord(10, -5)
      for (const n of hexNeighbors(center)) {
        expect(hexDistance(center, n)).toBe(1)
      }
    })
  })
  // ─── VTT Payload Types ───────────────────────────────────────────
  describe('VttPayloadType', () => {
    it('should enumerate payload kinds', () => {
      expect(VttPayloadType.TRANSFORM).toBe('transform')
      expect(VttPayloadType.FOG_OF_WAR).toBe('fog_of_war')
      expect(VttPayloadType.TOKEN_MOVE).toBe('token_move')
    })
  })

  describe('ViewTransform', () => {
    it('should have pan and zoom fields', () => {
      const t: ViewTransform = { panX: 100, panY: 200, zoom: 1.5 }
      expect(t.panX).toBe(100)
      expect(t.zoom).toBe(1.5)
    })
  })

  describe('FogOfWarState', () => {
    it('should have revealed hexes and gm id', () => {
      const fow: FogOfWarState = { revealedHexes: ['0,0'], gmId: 'gm-1' }
      expect(fow.revealedHexes).toContain('0,0')
    })
  })

  describe('TokenPosition', () => {
    it('should have tokenId and hex coordinate', () => {
      const tp: TokenPosition = { tokenId: 't1', hex: createHexCoord(3, 4) }
      expect(tp.tokenId).toBe('t1')
      expect(tp.hex.q).toBe(3)
    })
  })

  describe('createVttPayload()', () => {
    it('should create a transform payload', () => {
      const p = createVttPayload({
        type: VttPayloadType.TRANSFORM, campaignId: 'c1', senderId: 'u1',
        data: { panX: 50, panY: 75, zoom: 1.0 },
      })
      expect(p.type).toBe('transform')
      expect(p.campaignId).toBe('c1')
      expect(p.timestamp).toBeGreaterThan(0)
    })

    it('should create a fog-of-war payload', () => {
      const p = createVttPayload({
        type: VttPayloadType.FOG_OF_WAR, campaignId: 'c1', senderId: 'u1',
        data: { revealedHexes: ['1,0'], gmId: 'u1' },
      })
      expect(p.type).toBe('fog_of_war')
    })

    it('should create a token move payload', () => {
      const p = createVttPayload({
        type: VttPayloadType.TOKEN_MOVE, campaignId: 'c1', senderId: 'u1',
        data: { tokenId: 't1', hex: createHexCoord(5, -2) },
      })
      expect(p.type).toBe('token_move')
    })
  })

  describe('validateVttPayload()', () => {
    it('should return valid for well-formed payload', () => {
      const p = createVttPayload({
        type: VttPayloadType.TRANSFORM, campaignId: 'c1', senderId: 'u1',
        data: { panX: 0, panY: 0, zoom: 1 },
      })
      expect(validateVttPayload(p).valid).toBe(true)
    })

    it('should reject empty campaignId', () => {
      const r = validateVttPayload({
        type: VttPayloadType.TRANSFORM, campaignId: '', senderId: 'u1',
        data: { panX: 0, panY: 0, zoom: 1 }, timestamp: Date.now(),
      })
      expect(r.valid).toBe(false)
    })

    it('should reject unknown payload type', () => {
      const r = validateVttPayload({
        type: 'bad' as any, campaignId: 'c1', senderId: 'u1',
        data: {}, timestamp: Date.now(),
      })
      expect(r.valid).toBe(false)
    })
  })

  // ─── Clean Architecture Compliance ───────────────────────────────
  describe('Clean Architecture compliance', () => {
    it('should not import from Nuxt, Vue, or Supabase', async () => {
      const mod = await import('../../../src/core/domain/vtt')
      expect(mod.createHexCoord).toBeDefined()
      expect(mod.hexDistance).toBeDefined()
      expect(mod.createVttPayload).toBeDefined()
    })
  })

  describe('hexEquals()', () => {
    it('should return true for identical coordinates', () => {
      expect(hexEquals(createHexCoord(3, 4), createHexCoord(3, 4))).toBe(true)
    })
    it('should return false for different coordinates', () => {
      expect(hexEquals(createHexCoord(3, 4), createHexCoord(4, 3))).toBe(false)
    })
  })

  describe('hexToKey()', () => {
    it('should produce a consistent string key', () => {
      expect(hexToKey(createHexCoord(3, -2))).toBe('3,-2')
    })
    it('should produce the same key for equal hexes', () => {
      expect(hexToKey(createHexCoord(5, -3))).toBe(hexToKey(createHexCoord(5, -3)))
    })
    it('should produce unique keys for different hexes', () => {
      expect(hexToKey(createHexCoord(0, 0))).not.toBe(hexToKey(createHexCoord(0, 1)))
    })
  })
})