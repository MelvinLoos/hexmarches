// ─── Supabase Wiki Repository ──────────────────────────────────────
// Infrastructure adapter — implements WikiRepository using Supabase
// Handles database CRUD for Wiki Nodes, ltree querying, and FTS.

import type { WikiNode, CreateWikiNodeInput } from '~/src/core/domain/wiki-node'
import type { WikiRepository, WikiNodeSearchResult } from '~/src/core/domain/wiki-repository'
import type { SupabaseAdapter } from './adapter'

interface SupabaseWikiRow {
  id: string
  title: string
  content: string
  path: string
  parent_id?: string
  children?: string[]
  created_at: string
  updated_at: string
  rank?: number
  headline?: string
}

function toDomain(row: SupabaseWikiRow): WikiNode {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    path: row.path,
    parentId: row.parent_id,
    children: row.children,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

function toRow(input: Partial<CreateWikiNodeInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (input.title !== undefined) row.title = input.title
  if (input.content !== undefined) row.content = input.content
  if (input.path !== undefined) row.path = input.path
  if (input.parentId !== undefined) row.parent_id = input.parentId
  if (input.children !== undefined) row.children = input.children
  return row
}

export class SupabaseWikiRepository implements WikiRepository {
  private readonly adapter: SupabaseAdapter
  private readonly table = 'wiki_nodes'

  constructor(adapter: SupabaseAdapter) {
    this.adapter = adapter
  }

  async createNode(input: CreateWikiNodeInput): Promise<WikiNode> {
    const row = toRow(input)
    const { data, error } = await this.adapter
      .from(this.table)
      .insert(row)
      .select()
      .single()

    if (error) throw new Error(`Failed to create wiki node: ${error.message}`)
    return toDomain(data as SupabaseWikiRow)
  }

  async findById(id: string): Promise<WikiNode | null> {
    const { data, error } = await this.adapter
      .from(this.table)
      .select()
      .eq('id', id)
      .maybeSingle()

    if (error) throw new Error(`Failed to find wiki node: ${error.message}`)
    return data ? toDomain(data as SupabaseWikiRow) : null
  }

  async findByPath(path: string): Promise<WikiNode | null> {
    const { data, error } = await this.adapter
      .from(this.table)
      .select()
      .eq('path', path)
      .maybeSingle()

    if (error) throw new Error(`Failed to find wiki node by path: ${error.message}`)
    return data ? toDomain(data as SupabaseWikiRow) : null
  }

  async getDescendants(path: string): Promise<WikiNode[]> {
    const { data, error } = await this.adapter
      .from(this.table)
      .select()
      .like('path', `${path}%`)

    if (error) throw new Error(`Failed to fetch descendants: ${error.message}`)
    return (data as SupabaseWikiRow[]).map(toDomain)
  }

  async updateNode(
    id: string,
    updates: Partial<Pick<WikiNode, 'title' | 'content' | 'path'>>
  ): Promise<WikiNode | null> {
    const row = toRow(updates)
    row.updated_at = new Date().toISOString()

    const { data, error } = await this.adapter
      .from(this.table)
      .update(row)
      .eq('id', id)
      .select()

    if (error) throw new Error(`Failed to update wiki node: ${error.message}`)
    const rows = data as SupabaseWikiRow[]
    return rows.length > 0 ? toDomain(rows[0]) : null
  }

  async deleteNode(id: string): Promise<boolean> {
    const { data, error } = await this.adapter
      .from(this.table)
      .delete()
      .eq('id', id)
      .select()

    if (error) throw new Error(`Failed to delete wiki node: ${error.message}`)
    // data contains the deleted rows; empty array means nothing was deleted
    const rows = data as SupabaseWikiRow[] | null
    return rows !== null && rows.length > 0
  }

  async search(query: string, limit: number = 10): Promise<WikiNodeSearchResult[]> {
    const { data, error } = await this.adapter.client.rpc('search_wiki', {
      search_query: query,
    })

    if (error) throw new Error(`Failed to search wiki nodes: ${error.message}`)
    
    const rows = data as SupabaseWikiRow[]
    return rows.map(row => ({
      node: toDomain(row),
      rank: row.rank ?? 0,
      headline: row.headline ?? '',
    }))
  }
}