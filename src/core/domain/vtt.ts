// ─── VTT Domain: Hex Math & Payload Types ──────────────────────────
// Pure TypeScript — zero framework dependencies
// Per docs/architecture/01-domain.md §1.1:
//   - Hex Grid Mathematics: q, r axial coordinates
//   - VTT Payload: strict JSON structure for WebSocket sync

// ─── Hex Coordinate System (Axial q,r) ────────────────────────────

export interface HexCoord {
  readonly q: number
  readonly r: number
}

export function createHexCoord(q: number, r: number): HexCoord {
  if (!Number.isInteger(q)) {
    throw new Error(`Hex q coordinate must be an integer, got ${q}`)
  }
  if (!Number.isInteger(r)) {
    throw new Error(`Hex r coordinate must be an integer, got ${r}`)
  }
  return { q, r }
}

/**
 * Cube-coordinate hex distance: max(|dq|, |dr|, |ds|)
 * where s = -q - r in cube coords, so dq+dr = -(ds)
 */
export function hexDistance(a: HexCoord, b: HexCoord): number {
  const dq = Math.abs(a.q - b.q)
  const dr = Math.abs(a.r - b.r)
  const ds = Math.abs((a.q + a.r) - (b.q + b.r)) // = |(-s_a) - (-s_b)| = |s_b - s_a|
  return Math.max(dq, dr, ds)
}

/** Six axial direction vectors for a pointy-top hex grid */
const HEX_DIRECTIONS: ReadonlyArray<{ q: number; r: number }> = [
  { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
  { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
]

export function hexNeighbors(center: HexCoord): HexCoord[] {
  return HEX_DIRECTIONS.map(d => createHexCoord(center.q + d.q, center.r + d.r))
}

export function hexEquals(a: HexCoord, b: HexCoord): boolean {
  return a.q === b.q && a.r === b.r
}

export function hexToKey(hex: HexCoord): string {
  return `${hex.q},${hex.r}`
}

// ─── VTT Payload Types ─────────────────────────────────────────────

export enum VttPayloadType {
  TRANSFORM = 'transform',
  FOG_OF_WAR = 'fog_of_war',
  TOKEN_MOVE = 'token_move',
}

export interface ViewTransform {
  panX: number
  panY: number
  zoom: number
}

export interface FogOfWarState {
  revealedHexes: string[] // hex keys
  gmId: string
}

export interface TokenPosition {
  tokenId: string
  hex: HexCoord
}

export type VttPayloadData = ViewTransform | FogOfWarState | TokenPosition

export interface VttPayload {
  type: VttPayloadType
  campaignId: string
  senderId: string
  timestamp: number
  data: VttPayloadData
}

export interface VttPayloadInput {
  type: VttPayloadType
  campaignId: string
  senderId: string
  data: VttPayloadData
}

export function createVttPayload(input: VttPayloadInput): VttPayload {
  return {
    type: input.type,
    campaignId: input.campaignId,
    senderId: input.senderId,
    timestamp: Date.now(),
    data: input.data,
  }
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

const VALID_TYPES = new Set<string>(Object.values(VttPayloadType))

export function validateVttPayload(payload: VttPayload): ValidationResult {
  const errors: string[] = []

  if (!payload.campaignId || payload.campaignId.trim().length === 0) {
    errors.push('campaignId is required and must not be empty')
  }

  if (!payload.senderId || payload.senderId.trim().length === 0) {
    errors.push('senderId is required and must not be empty')
  }

  if (!VALID_TYPES.has(payload.type)) {
    errors.push(`Unknown payload type: ${payload.type}`)
  }

  if (!payload.data) {
    errors.push('data is required')
  }

  return { valid: errors.length === 0, errors }
}