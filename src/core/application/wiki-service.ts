// ─── Wiki Service ─────────────────────────────────────────────────
// Application layer — orchestrates domain rules and infrastructure
// Per docs/architecture/sprints/01-campaign-wiki.md §1:
//   Sanitization over Trust: sanitize all markdown string inputs from
//   the GM editor prior to passing them to the Infrastructure Layer.

import type { WikiNode, CreateWikiNodeInput } from '~/src/core/domain/wiki-node'
import type { WikiRepository, WikiNodeSearchResult } from '~/src/core/domain/wiki-repository'
import { validateLtreePath, LtreeValidationError } from '~/src/core/domain/wiki-node'

// ─── Markdown Sanitization ─────────────────────────────────────────

/**
 * Strips dangerous HTML tags and attributes from markdown input.
 * - Removes <script> tags (all variants)
 * - Removes on* event handlers (onerror, onclick, onload, etc.)
 * - Removes javascript: protocol URLs
 * - Removes <iframe> tags
 * Preserves legitimate markdown and safe HTML elements.
 */
export function sanitizeMarkdown(input: string): string {
  let sanitized = input

  // Remove <script> tags (with optional attributes and body)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  // Remove self-closing <script ... />
  sanitized = sanitized.replace(/<script\b[^>]*\/>/gi, '')

  // Remove <iframe> tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
  sanitized = sanitized.replace(/<iframe\b[^>]*\/>/gi, '')

  // Remove on* event handler attributes
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')

  // Remove javascript: protocol URLs from href/src attributes
  sanitized = sanitized.replace(/href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, '')
  sanitized = sanitized.replace(/src\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, '')

  // Remove any remaining <script> fragments (opening tags without closing)
  sanitized = sanitized.replace(/<\/?script[^>]*>/gi, '')

  return sanitized
}

// ─── Wiki Service ─────────────────────────────────────────────────

export class WikiService {
  constructor(private readonly repo: WikiRepository) {}

  async createNode(input: CreateWikiNodeInput): Promise<WikiNode> {
    // Validate ltree path
    if (!validateLtreePath(input.path)) {
      throw new LtreeValidationError(input.path)
    }

    // Sanitize markdown content
    const sanitizedInput: CreateWikiNodeInput = {
      ...input,
      content: sanitizeMarkdown(input.content),
    }

    return this.repo.createNode(sanitizedInput)
  }

  async updateNode(
    id: string,
    updates: Partial<Pick<WikiNode, 'title' | 'content' | 'path'>>
  ): Promise<WikiNode | null> {
    // Validate new path if provided
    if (updates.path !== undefined && !validateLtreePath(updates.path)) {
      throw new LtreeValidationError(updates.path)
    }

    // Sanitize content if provided
    const sanitizedUpdates = { ...updates }
    if (updates.content !== undefined) {
      sanitizedUpdates.content = sanitizeMarkdown(updates.content)
    }

    return this.repo.updateNode(id, sanitizedUpdates)
  }

  async getNodeTree(path: string): Promise<WikiNode[]> {
    // Allow empty string to fetch all nodes (used by sidebar/parent selector)
    if (path === '') {
      return this.repo.getDescendants('')
    }
    // Validate path before querying
    if (!validateLtreePath(path)) {
      throw new LtreeValidationError(path)
    }

    return this.repo.getDescendants(path)
  }

  async searchNodes(query: string, limit?: number): Promise<WikiNodeSearchResult[]> {
    // Sanitize the search query
    const sanitizedQuery = sanitizeMarkdown(query)
    return this.repo.search(sanitizedQuery, limit)
  }
}