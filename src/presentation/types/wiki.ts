// ─── Wiki Domain Types ─────────────────────────────────────────────
// Presentation-layer types for Campaign Wiki Nodes

export interface WikiNode {
  id: string
  title: string
  content: string // MDC markdown content
  path: string    // ltree-style hierarchical path (e.g. "campaign.chapter1.section2")
  parentId?: string
  children?: string[]
  createdAt: Date
  updatedAt: Date
}