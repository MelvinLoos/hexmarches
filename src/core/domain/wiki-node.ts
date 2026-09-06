// ─── Wiki Node Domain ───────────────────────────────────────────────
// Pure TypeScript — zero framework dependencies
// Per docs/architecture/01-domain.md §1.2 Context A:
//   Markdown parsing, hierarchical ltree navigation, Full-Text Search
// Per docs/architecture/sprints/01-campaign-wiki.md §1:
//   TDD Markdown parsing: validate ltree Node Paths structural integrity

// ─── Ltree Path Validation ──────────────────────────────────────────

/**
 * PostgreSQL ltree path validation — lowercase alphanumeric + underscore,
 * segments separated by dots. No spaces, no special chars, no hyphens.
 * Pattern: ^[a-z_][a-z0-9_]*(\\.[a-z_][a-z0-9_]*)*$
 */
const LTREE_SEGMENT_RE = /^[a-z_][a-z0-9_]*$/

/**
 * Validates a single ltree segment (between dots).
 * Accepts: lowercase letters, digits, underscore. Must start with a letter or underscore.
 */
export function isValidLtreeSegment(segment: string): boolean {
  if (typeof segment !== 'string') return false
  return LTREE_SEGMENT_RE.test(segment)
}

/**
 * Validates a complete ltree dot-notation path.
 * Rejects: spaces, special chars, empty segments, double dots,
 * leading/trailing dots, uppercase characters.
 *
 * @param path - The ltree path string to validate
 * @returns true if the path is valid, false otherwise
 */
export function validateLtreePath(path: string): boolean {
  if (typeof path !== 'string') return false
  if (path.length === 0) return false
  if (path.trim().length !== path.length) return false
  if (path.startsWith('.')) return false
  if (path.endsWith('.')) return false
  if (path.includes('..')) return false

  const segments = path.split('.')
  if (segments.length === 0) return false

  return segments.every(isValidLtreeSegment)
}

// ─── Wiki Node Entity ───────────────────────────────────────────────

/** WikiNodeType enum — defines the six canonical entity types per Sprint 1.8 */
export enum WikiNodeType {
  GENERAL = 'GENERAL',
  LOCATION = 'LOCATION',
  NPC = 'NPC',
  FACTION = 'FACTION',
  ITEM = 'ITEM',
  QUEST = 'QUEST',
}

export interface WikiNode {
  readonly id: string
  readonly title: string
  readonly content: string // MDC markdown content
  readonly path: string // ltree-style hierarchical path
  readonly parentId?: string
  readonly children?: string[]
  readonly coverImageUrl?: string
  readonly entityType?: WikiNodeType
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface CreateWikiNodeInput {
  title: string
  content: string
  path: string
  parentId?: string
  children?: string[]
  coverImageUrl?: string
  entityType?: WikiNodeType
  createdAt?: Date
  updatedAt?: Date
}

// ─── Domain Error ───────────────────────────────────────────────────

export class LtreeValidationError extends Error {
  constructor(path: string) {
    super(`Invalid ltree path: "${path}". Path must use lowercase alphanumeric segments separated by dots.`)
    this.name = 'LtreeValidationError'
  }
}
// ─── Title Slugification ─────────────────────────────────────────────
// Converts human-readable titles into valid ltree segments.
// Pure domain logic — no framework dependencies.

/**
 * Converts a human-readable title into a valid ltree segment.
 * - Lowercases
 * - Replaces non-alphanumeric chars (except underscores) with underscores
 * - Collapses consecutive underscores
 * - Trims leading/trailing underscores
 *
 * @param title - Raw human-readable title (e.g. "The Harpers!")
 * @returns A valid ltree segment (e.g. "the_harpers")
 */
export function slugifyTitle(title: string): string {
  // Lowercase
  let slug = title.toLowerCase()
  // Replace any non-alphanumeric, non-underscore character with underscore
  slug = slug.replace(/[^a-z0-9_]/g, '_')
  // Collapse consecutive underscores
  slug = slug.replace(/_+/g, '_')
  // Strip leading/trailing underscores
  slug = slug.replace(/^_+|_+$/g, '')
  return slug
}

/**
 * Generates a full ltree child path from a parent path and title.
 * If the parent path is empty, returns just the slugified title.
 *
 * @param parentPath - The parent ltree path (e.g. "campaign.factions") or empty string
 * @param title - Raw human-readable title for the child node
 * @returns The full ltree path for the child node
 */
export function generateChildPath(parentPath: string, title: string): string {
  const slug = slugifyTitle(title)
  if (!parentPath) return slug
  return `${parentPath}.${slug}`
}

// ─── Factory ────────────────────────────────────────────────────────

let nodeIdCounter = 0

export function createWikiNode(input: CreateWikiNodeInput): WikiNode {
  if (!validateLtreePath(input.path)) {
    throw new LtreeValidationError(input.path)
  }

  nodeIdCounter++
  return {
    id: `node-${Date.now()}-${nodeIdCounter}`,
    title: input.title,
    content: input.content,
    path: input.path,
    parentId: input.parentId,
    children: input.children,
    coverImageUrl: input.coverImageUrl,
    entityType: input.entityType,
    createdAt: input.createdAt ?? new Date(),
    updatedAt: input.updatedAt ?? new Date(),
  }
}