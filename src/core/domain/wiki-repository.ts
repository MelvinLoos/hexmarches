// ─── Wiki Repository Interface ──────────────────────────────────────
// Domain-layer port — defines the contract for wiki data persistence.
// Infrastructure adapters implement this interface.

import type { WikiNode, CreateWikiNodeInput } from './wiki-node'

export interface WikiNodeSearchResult {
  node: WikiNode
  rank: number
  headline: string
}

export interface WikiRepository {
  /** Create a new wiki node. Returns the created node with generated ID. */
  createNode(input: CreateWikiNodeInput): Promise<WikiNode>

  /** Find a node by its unique ID. */
  findById(id: string): Promise<WikiNode | null>

  /** Find a node by its exact ltree path. */
  findByPath(path: string): Promise<WikiNode | null>

  /** Fetch all descendants of a given ltree path (prefix match). */
  getDescendants(path: string): Promise<WikiNode[]>

  /** Update a node's title, content, path, cover image, and/or entity type. */
  updateNode(id: string, updates: Partial<Pick<WikiNode, 'title' | 'content' | 'path' | 'coverImageUrl' | 'entityType'>>): Promise<WikiNode | null>

  /** Delete a node by its ID. Returns true if deleted. */
  deleteNode(id: string): Promise<boolean>

  /** Full-text search across wiki node content. */
  search(query: string, limit?: number): Promise<WikiNodeSearchResult[]>
}