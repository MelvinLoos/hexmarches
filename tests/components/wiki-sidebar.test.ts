import { describe, it, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import WikiSidebar from '../../components/wiki/WikiSidebar.vue'
import type { WikiNode } from '~/src/core/domain/wiki-node'

// ─── Issue #15: Task 2 — Recursive File Tree Sidebar ──────────────────────
// AC1: Component test mocks a list of nested WikiNode objects
// AC2: Asserts nested HTML structure matches ltree hierarchy
// AC3: Each node is clickable (NuxtLink or emits navigation)
// AC4: Nodes with children are visually distinct (folders) from leaf nodes (files)

const testNodes: WikiNode[] = [
  {
    id: 'n1',
    title: 'Locations',
    content: '',
    path: 'locations',
    createdAt: new Date('2025-06-01'),
    updatedAt: new Date('2025-06-01'),
  },
  {
    id: 'n2',
    title: 'Dark Forest',
    content: '# Dark Forest\\nA spooky forest.',
    path: 'locations.forest',
    parentId: 'n1',
    createdAt: new Date('2025-06-02'),
    updatedAt: new Date('2025-06-02'),
  },
  {
    id: 'n3',
    title: 'Elder Cave',
    content: '## Elder Cave',
    path: 'locations.forest.cave',
    parentId: 'n2',
    createdAt: new Date('2025-06-03'),
    updatedAt: new Date('2025-06-03'),
  },
  {
    id: 'n4',
    title: 'Deep Pool',
    content: 'A dark pool.',
    path: 'locations.forest.pool',
    parentId: 'n2',
    createdAt: new Date('2025-06-04'),
    updatedAt: new Date('2025-06-04'),
  },
  {
    id: 'n5',
    title: 'Characters',
    content: '',
    path: 'characters',
    createdAt: new Date('2025-06-01'),
    updatedAt: new Date('2025-06-01'),
  },
  {
    id: 'n6',
    title: 'Gandalf',
    content: 'A wizard.',
    path: 'characters.gandalf',
    parentId: 'n5',
    createdAt: new Date('2025-06-05'),
    updatedAt: new Date('2025-06-05'),
  },
]

function mountSidebar(nodes?: WikiNode[]) {
  return mount(WikiSidebar, {
    props: { nodes: nodes ?? testNodes },
    global: {
      stubs: { NuxtLink: RouterLinkStub },
    },
  })
}

describe('Issue #15: Recursive File Tree Sidebar', () => {
  it('renders the sidebar container', () => {
    const wrapper = mountSidebar()
    expect(wrapper.find('[data-testid="wiki-sidebar"]').exists()).toBe(true)
  })

  it('renders top-level folder names', () => {
    const wrapper = mountSidebar()
    const text = wrapper.text()
    expect(text).toContain('Locations')
    expect(text).toContain('Characters')
  })

  it('renders leaf nodes as links to their ltree path', () => {
    const wrapper = mountSidebar()
    const links = wrapper.findAllComponents(RouterLinkStub)
    const forestLink = links.find(l => l.props().to === '/wiki/locations/forest')
    expect(forestLink).toBeDefined()
    expect(forestLink?.text()).toContain('Dark Forest')
  })

  it('renders deeply nested nodes (3 levels deep)', () => {
    const wrapper = mountSidebar()
    const text = wrapper.text()
    // Elder Cave and Deep Pool are children of Dark Forest
    expect(text).toContain('Elder Cave')
    expect(text).toContain('Deep Pool')
  })

  it('applies folder class to nodes that have children', () => {
    const wrapper = mountSidebar()
    // Locations has children (forest), so it should have a folder indicator
    const folderNodes = wrapper.findAll('[data-testid="tree-node-folder"]')
    expect(folderNodes.length).toBeGreaterThanOrEqual(2) // Locations, Dark Forest
  })

  it('shows empty state when no nodes provided', () => {
    const wrapper = mountSidebar([])
    expect(wrapper.find('[data-testid="wiki-sidebar-empty"]').exists()).toBe(true)
  })

  it('renders total count of accessible nodes', () => {
    const wrapper = mountSidebar()
    // All 6 nodes should be rendered
    const allNodes = wrapper.findAll('[data-testid^="tree-node"]')
    expect(allNodes.length).toBe(6)
  })
})