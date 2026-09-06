import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import type { WikiNode } from '~/src/core/domain/wiki-node'

// ─── Issue #17: Task 3 — Dynamic Wiki Viewer Route ──────────────────────────
// AC1: Navigating to /wiki/locations/forest fetches correct node and renders content
// AC2: Page embeds WikiSidebar alongside WikiRenderer
// AC3: URL catch-all segments joined with dots → ltree path
// AC4: Handles missing nodes (not-found state)

// ─── Mock WikiService ──────────────────────────────────────────────────
const mockFindByPath = vi.fn()
const mockGetDescendants = vi.fn()

vi.mock('~/composables/useWikiService', () => ({
  useWikiService: () => ({
    findByPath: mockFindByPath,
    getNodeTree: mockGetDescendants,
  }),
}))

// ─── Mock Nuxt composables ────────────────────────────────────────────
const mockRouteParams = { slug: ['locations', 'forest'] }

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: mockRouteParams,
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('#imports', () => ({
  navigateTo: vi.fn(),
  useSupabaseClient: () => ({
    from: () => ({ select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn(), eq: vi.fn(), like: vi.fn(), single: vi.fn(), maybeSingle: vi.fn() }),
    channel: vi.fn(),
    rpc: vi.fn(),
  }),
}))

// ─── Mock WikiSidebar ──────────────────────────────────────────────────
const SidebarStub = {
  template: '<div data-testid="wiki-sidebar">Sidebar</div>',
  props: ['nodes'],
  name: 'WikiSidebar',
}

// ─── Mock WikiRenderer ─────────────────────────────────────────────────
const RendererStub = {
  template: '<div data-testid="wiki-renderer">{{ content }}</div>',
  props: ['content'],
  name: 'WikiRenderer',
}

import WikiViewerPage from '../../pages/wiki/[...slug].vue'

function mountPage(slug: string[] = ['locations', 'forest']) {
  mockRouteParams.slug = slug
  return mount(WikiViewerPage, {
    global: {
      stubs: {
        WikiSidebar: SidebarStub,
        WikiRenderer: RendererStub,
        NuxtLink: RouterLinkStub,
      },
    },
  })
}

describe('Issue #17: Dynamic Wiki Viewer Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('joins slug segments into ltree path', async () => {
    const mockNode: WikiNode = {
      id: 'n1',
      title: 'Dark Forest',
      content: '# Dark Forest\nA spooky forest.',
      path: 'locations.forest',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    mockFindByPath.mockResolvedValue(mockNode)
    mockGetDescendants.mockResolvedValue([mockNode])

    mountPage(['locations', 'forest'])

    expect(mockFindByPath).toHaveBeenCalledWith('locations.forest')
  })

  it('renders wiki node title when node is found', async () => {
    const mockNode: WikiNode = {
      id: 'n1',
      title: 'Dark Forest',
      content: '# Dark Forest\nA spooky forest.',
      path: 'locations.forest',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    mockFindByPath.mockResolvedValue(mockNode)
    mockGetDescendants.mockResolvedValue([mockNode])

    const wrapper = mountPage(['locations', 'forest'])
    // Wait for async fetch
    await new Promise(r => setTimeout(r, 10))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Dark Forest')
  })

  it('renders WikiRenderer with node content', async () => {
    const mockNode: WikiNode = {
      id: 'n1',
      title: 'Dark Forest',
      content: '# Witch Hut\nThe old witch lives here.',
      path: 'locations.forest',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    mockFindByPath.mockResolvedValue(mockNode)
    mockGetDescendants.mockResolvedValue([mockNode])

    const wrapper = mountPage(['locations', 'forest'])
    await new Promise(r => setTimeout(r, 10))
    await wrapper.vm.$nextTick()

    const renderer = wrapper.find('[data-testid="wiki-renderer"]')
    expect(renderer.exists()).toBe(true)
    expect(renderer.text()).toBe(mockNode.content)
  })

  it('embeds WikiSidebar component', async () => {
    const mockNode: WikiNode = {
      id: 'n1',
      title: 'Test',
      content: '# Test',
      path: 'test',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    mockFindByPath.mockResolvedValue(mockNode)
    mockGetDescendants.mockResolvedValue([mockNode])

    const wrapper = mountPage(['test'])
    await new Promise(r => setTimeout(r, 10))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="wiki-sidebar"]').exists()).toBe(true)
  })

  it('shows not-found state when node does not exist', async () => {
    mockFindByPath.mockResolvedValue(null)
    mockGetDescendants.mockResolvedValue([])

    const wrapper = mountPage(['nonexistent'])
    await new Promise(r => setTimeout(r, 10))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="wiki-not-found"]').exists()).toBe(true)
  })

  it('shows loading state initially', () => {
    mockFindByPath.mockReturnValue(new Promise(() => {})) // never resolves
    mockGetDescendants.mockResolvedValue([])

    const wrapper = mountPage(['locations', 'forest'])
    expect(wrapper.find('[data-testid="wiki-loading"]').exists()).toBe(true)
  })

  it('handles single-segment slug', async () => {
    const mockNode: WikiNode = {
      id: 'n1',
      title: 'Root',
      content: '# Root',
      path: 'root',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    mockFindByPath.mockResolvedValue(mockNode)
    mockGetDescendants.mockResolvedValue([mockNode])

    mountPage(['root'])
    expect(mockFindByPath).toHaveBeenCalledWith('root')
  })
})