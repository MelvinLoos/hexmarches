// ─── Wiki Service ─────────────────────────────────────────────────
// Application layer — orchestrates domain rules and infrastructure
import type { WikiNode, CreateWikiNodeInput } from '~/src/core/domain/wiki-node'
import type { WikiRepository, WikiNodeSearchResult } from '~/src/core/domain/wiki-repository'
import { validateLtreePath, LtreeValidationError } from '~/src/core/domain/wiki-node'

// ─── Markdown Sanitization ─────────────────────────────────────────

export function sanitizeMarkdown(input: string): string {
  let sanitized = input
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  sanitized = sanitized.replace(/<script\b[^>]*\/>/gi, '')
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
  sanitized = sanitized.replace(/<iframe\b[^>]*\/>/gi, '')
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  sanitized = sanitized.replace(/href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, '')
  sanitized = sanitized.replace(/src\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, '')
  sanitized = sanitized.replace(/<\/?script[^>]*>/gi, '')
  return sanitized
}

// ─── Wiki Service ─────────────────────────────────────────────────

export class WikiService {
  constructor(private readonly repo: WikiRepository) {}

  async createNode(input: CreateWikiNodeInput): Promise<WikiNode> {
    if (!validateLtreePath(input.path)) {
      throw new LtreeValidationError(input.path)
    }
    const sanitizedInput: CreateWikiNodeInput = {
      ...input,
      content: sanitizeMarkdown(input.content),
    }
    return this.repo.createNode(sanitizedInput)
  }

  async updateNode(
    id: string,
    updates: Partial<Pick<WikiNode, 'title' | 'content' | 'path' | 'coverImageUrl' | 'entityType'>>
  ): Promise<WikiNode | null> {
    if (updates.path !== undefined && !validateLtreePath(updates.path)) {
      throw new LtreeValidationError(updates.path)
    }
    const sanitizedUpdates = { ...updates }
    if (updates.content !== undefined) {
      sanitizedUpdates.content = sanitizeMarkdown(updates.content)
    }
    return this.repo.updateNode(id, sanitizedUpdates)
  }

  async deleteNode(id: string): Promise<boolean> {
    return this.repo.deleteNode(id)
  }

  async getNodeTree(path: string): Promise<WikiNode[]> {
    if (path === '') {
      return this.repo.getDescendants('')
    }
    if (!validateLtreePath(path)) {
      throw new LtreeValidationError(path)
    }
    return this.repo.getDescendants(path)
  }

  async findById(id: string): Promise<WikiNode | null> {
    return this.repo.findById(id)
  }

  async findByPath(path: string): Promise<WikiNode | null> {
    if (path === '') return null
    if (!validateLtreePath(path)) {
      throw new LtreeValidationError(path)
    }
    return this.repo.findByPath(path)
  }

  async searchNodes(query: string, limit?: number): Promise<WikiNodeSearchResult[]> {
    const sanitizedQuery = sanitizeMarkdown(query)
    return this.repo.search(sanitizedQuery, limit)
  }
}
