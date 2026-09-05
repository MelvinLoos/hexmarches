// ─── Milestone Tiering Domain ────────────────────────────────────────
// Pure TypeScript — zero framework dependencies
// Per docs/architecture/01-domain.md §1.1:
//   Tier 1: 0-3 milestones, Tier 2: 4-9 milestones, Tier 3: 10+ milestones

export enum Tier {
  TIER_1 = 1,
  TIER_2 = 2,
  TIER_3 = 3,
}

export interface Milestone {
  id: string
  characterId: string
  title: string
  description: string
  awardedAt: Date
}

/**
 * Calculate the tier for a given milestone count.
 * Pure function — no side effects, no framework imports.
 */
export function calculateTier(milestoneCount: number): Tier {
  if (!Number.isInteger(milestoneCount)) {
    throw new Error(
      `Milestone count must be an integer, got ${milestoneCount}`
    )
  }
  if (milestoneCount < 0) {
    throw new Error(
      `Milestone count must be non-negative, got ${milestoneCount}`
    )
  }

  if (milestoneCount <= 3) return Tier.TIER_1
  if (milestoneCount <= 9) return Tier.TIER_2
  return Tier.TIER_3
}

export interface CharacterState {
  id: string
  name: string
  milestoneCount: number
  tier: Tier
}

export class Character {
  public readonly id: string
  public readonly name: string
  private _milestoneCount: number

  constructor(id: string, name: string, milestoneCount: number = 0) {
    if (!Number.isInteger(milestoneCount) || milestoneCount < 0) {
      throw new Error(
        `Invalid milestone count: ${milestoneCount}. Must be a non-negative integer.`
      )
    }
    this.id = id
    this.name = name
    this._milestoneCount = milestoneCount
  }

  get milestoneCount(): number {
    return this._milestoneCount
  }

  get tier(): Tier {
    return calculateTier(this._milestoneCount)
  }

  addMilestone(): void {
    this._milestoneCount += 1
  }

  addMilestones(count: number): void {
    if (!Number.isInteger(count) || count < 1) {
      throw new Error(
        `Cannot add ${count} milestones. Must be a positive integer.`
      )
    }
    this._milestoneCount += count
  }

  toJSON(): CharacterState {
    return {
      id: this.id,
      name: this.name,
      milestoneCount: this._milestoneCount,
      tier: this.tier,
    }
  }
}