import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { ref } from 'vue'
import type { WikiNode } from '~/src/core/domain/wiki-node'

// ─── Mock GM status ───────────────────────────────────────────────
const mockIsGm = ref(true)

vi.mock('~/composables/useGmStatus', () => ({
  useGmStatus: () => ({
    isGm: mockIsGm,
    setGmStatus: vi.fn(),
  }),
}))

// ─── Mock useToast ─────────────────────────────────────────────────
const mockShowSuccess = vi.fn()
const mockShowError = vi.fn()

vi.mock('~/composables/useToast', () => ({
  useToast: () => ({
    toasts: ref([]),
    success: mockShowSuccess,
    error: mockShowError,
  }),
}))

// ─── Mock WikiService ──────────────────────────────────────────────
const mockFindByPath = vi.fn()
const mockGetDescendants = vi.fn()
const mockDeleteNode = vi.fn()

vi.mock('~/composables/useWikiService', () => ({
  useWikiService: () => ({
    findByPath: mockFindByPath,
    getNodeTree: mockGetDescendants,
    deleteNode: mockDeleteNode,
  }),
}))

// ─── Mock Nuxt composables ────────────────────────────────────────
const mockRouteParams = { slug: ['locations', 'forest'] }
const mockRouterPush = vi.fn()

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')
  return {
    ...actual,
    useRoute: () => ({ params: mockRouteParams }),
    useRouter: () => ({ push: mockRouterPush }),
  }
})

vi.mock('#imports', () => ({
  useSupabaseClient: () => ({
    from: () => ({ select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn(), eq: vi.fn(), like: vi.fn(), single: vi.fn(), maybeSingle: vi.fn() }),
    channel: vi.fn(),
    rpc: vi.fn(),
  }),
}))

// ─── Stubs ─────────────────────────────────────────────────────────
const SidebarStub = {
  template: '<div data-testid="wiki-sidebar">Sidebar</div>',
  props: ['nodes'],
  name: 'WikiSidebar',
}
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
  const mockNode: WikiNode = {
    id: 'n1',
    title: 'Dark Forest',
    content: '# Dark Forest\nA spooky forest.',
    path: 'locations.forest',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsGm.value = true
    mockFindByPath.mockResolvedValue(mockNode)
    mockGetDescendants.mockResolvedValue([mockNode])
    mockDeleteNode.mockResolvedValue(true)
  })

  it('joins slug segments into ltree path', async () => {
    mountPage(['locations', 'forest'])
    await new Promise(r => setTimeout(r, 10))
    expect(mockFindByPath).toHaveBeenCalledWith('locations.forest')
  })

  it('renders wiki node title when node is found', async () => {
    const wrapper = mountPage(['locations', 'forest'])
    await new Promise(r => setTimeout(r, 10))
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Dark Forest')
  })

  it('renders WikiRenderer with node content', async () => {
    const wrapper = mountPage(['locations', 'forest'])
    await new Promise(r => setTimeout(r, 10))
    await wrapper.vm.$nextTick()
    const renderer = wrapper.find('[data-testid="wiki-renderer"]')
    expect(renderer.exists()).toBe(true)
    expect(renderer.text()).toBe(mockNode.content)
  })

  it('embeds WikiSidebar component', async () => {
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
    mockFindByPath.mockReturnValue(new Promise(() => {}))
    mockGetDescendants.mockResolvedValue([])
    const wrapper = mountPage(['locations', 'forest'])
    expect(wrapper.find('[data-testid="wiki-loading"]').exists()).toBe(true)
  })

  it('handles single-segment slug', async () => {
    mountPage(['root'])
    await new Promise(r => setTimeout(r, 10))
    expect(mockFindByPath).toHaveBeenCalledWith('root')
  })

  // ─── Anti-regression: GM-only action buttons ─────────────────────
  describe('GM action buttons', () => {
    it('shows Edit button when isGm is true', async () => {
      mockIsGm.value = true
      const wrapper = mountPage(['locations', 'forest'])
      await new Promise(r => setTimeout(r, 10))
      await wrapper.vm.$nextTick()

      const btn = wrapper.find('[data-testid="wiki-edit-button"]')
      expect(btn.exists()).toBe(true)
      expect(btn.text()).toBe('Edit')
    })

    it('shows Delete button when isGm is true', async () => {
      mockIsGm.value = true
      const wrapper = mountPage(['locations', 'forest'])
      await new Promise(r => setTimeout(r, 10))
      await wrapper.vm.$nextTick()

      const btn = wrapper.find('[data-testid="wiki-delete-button"]')
      expect(btn.exists()).toBe(true)
      expect(btn.text()).toBe('Delete')
    })

    it('hides Edit button when isGm is false', async () => {
      mockIsGm.value = false
      const wrapper = mountPage(['locations', 'forest'])
      await new Promise(r => setTimeout(r, 10))
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="wiki-edit-button"]').exists()).toBe(false)
    })

    it('hides Delete button when isGm is false', async () => {
      mockIsGm.value = false
      const wrapper = mountPage(['locations', 'forest'])
      await new Promise(r => setTimeout(r, 10))
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="wiki-delete-button"]').exists()).toBe(false)
    })

    it('calls deleteNode and navigates to /wiki after Delete click', async () => {
      mockIsGm.value = true
      vi.spyOn(window, 'confirm').mockReturnValue(true)

      const wrapper = mountPage(['locations', 'forest'])
      await new Promise(r => setTimeout(r, 10))
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-testid="wiki-delete-button"]').trigger('click')
      await new Promise(r => setTimeout(r, 20))
      await wrapper.vm.$nextTick()

      expect(mockDeleteNode).toHaveBeenCalledWith('n1')
      expect(mockShowSuccess).toHaveBeenCalledWith('"Dark Forest" deleted.')
      expect(mockRouterPush).toHaveBeenCalledWith('/wiki')
    })
  })
})
