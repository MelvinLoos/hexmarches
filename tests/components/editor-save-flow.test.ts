import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import type { WikiNode } from '~/src/core/domain/wiki-node'

// ─── Mock router.push for redirect tests ──────────────────────────
const mockRouterPush = vi.fn()

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')
  return {
    ...actual,
    useRoute: () => ({
      params: mockRouteData,
    }),
    useRouter: () => ({
      push: mockRouterPush,
    }),
  }
})

// ─── Mock WikiService ──────────────────────────────────────────────
const mockFindByPath = vi.fn()
const mockCreateNode = vi.fn()
const mockUpdateNode = vi.fn()
const mockGetDescendants = vi.fn()

vi.mock('~/composables/useWikiService', () => ({
  useWikiService: () => ({
    findByPath: mockFindByPath,
    createNode: mockCreateNode,
    updateNode: mockUpdateNode,
    getNodeTree: mockGetDescendants,
  }),
}))

vi.mock('#imports', () => ({
  useSupabaseClient: () => ({}),
}))

// ─── Mock route params for edit page ───────────────────────────────
const mockRouteData = { slug: [] as string[] }

// ─── Stubs ─────────────────────────────────────────────────────────
const EditorStub = {
  template: `<div data-testid="gm-wiki-editor">
    <button data-testid="trigger-save" @click="$emit('save', { title: 'Test Node', content: '# Hello', path: 'test.hello' })">Save</button>
  </div>`,
  props: ['initialTitle', 'initialContent', 'initialPath'],
  emits: ['save'],
  name: 'GmWikiEditor',
}

import EditCreatePage from '../../pages/dm/wiki/edit/index.vue'
import EditSlugPage from '../../pages/dm/wiki/edit/[...slug].vue'

function mountCreatePage() {
  return mount(EditCreatePage, {
    global: {
      stubs: {
        GmWikiEditor: EditorStub,
        NuxtLink: RouterLinkStub,
      },
    },
  })
}

function mountEditPage(slug: string[] = ['campaign', 'old']) {
  mockRouteData.slug = slug

  return mount(EditSlugPage, {
    global: {
      stubs: {
        GmWikiEditor: EditorStub,
        NuxtLink: RouterLinkStub,
      },
    },
  })
}

describe('Issue #16: Editor Data-Binding & Save Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Creating a new node (no slug)', () => {
    it('renders editor with empty fields', () => {
      const wrapper = mountCreatePage()
      expect(wrapper.find('[data-testid="gm-wiki-editor"]').exists()).toBe(true)
    })

    it('calls WikiService.createNode on save', async () => {
      mockCreateNode.mockResolvedValue({
        id: 'new-1',
        title: 'Test Node',
        content: '# Hello',
        path: 'test.hello',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const wrapper = mountCreatePage()
      await wrapper.find('[data-testid="trigger-save"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockCreateNode).toHaveBeenCalledWith({
        title: 'Test Node',
        content: '# Hello',
        path: 'test.hello',
      })
    })

    it('shows success toast after successful save', async () => {
      mockCreateNode.mockResolvedValue({
        id: 'new-1',
        title: 'Test Node',
        content: '# Hello',
        path: 'test.hello',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const wrapper = mountCreatePage()
      await wrapper.find('[data-testid="trigger-save"]').trigger('click')
      await new Promise(r => setTimeout(r, 20))
      await wrapper.vm.$nextTick()

      const toast = wrapper.find('[data-testid="toast-success"]')
      expect(toast.exists()).toBe(true)
      expect(toast.text()).toContain('created')
    })

    it('shows error toast on save failure', async () => {
      mockCreateNode.mockRejectedValue(new Error('DB error'))

      const wrapper = mountCreatePage()
      await wrapper.find('[data-testid="trigger-save"]').trigger('click')
      await new Promise(r => setTimeout(r, 20))
      await wrapper.vm.$nextTick()

      const toast = wrapper.find('[data-testid="toast-error"]')
      expect(toast.exists()).toBe(true)
    })

    // ANTI-REGRESSION: should navigate after successful create
    it('should navigate to wiki viewer page after successful create', async () => {
      mockCreateNode.mockResolvedValue({
        id: 'new-1',
        title: 'Test Node',
        content: '# Hello',
        path: 'test.hello',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const wrapper = mountCreatePage()
      await wrapper.find('[data-testid="trigger-save"]').trigger('click')
      await new Promise(r => setTimeout(r, 20))
      await wrapper.vm.$nextTick()

      expect(mockRouterPush).toHaveBeenCalledWith('/wiki/test/hello')
    })
  })

  describe('Editing an existing node (with slug)', () => {
    const existingNode: WikiNode = {
      id: 'existing-1',
      title: 'Old Title',
      content: '# Old Content',
      path: 'campaign.old',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    }

    it('joins multi-segment slug array into ltree path', async () => {
      mockFindByPath.mockResolvedValue(existingNode)
      mockGetDescendants.mockResolvedValue([])

      mountEditPage(['campaign', 'old'])
      await new Promise(r => setTimeout(r, 10))

      expect(mockFindByPath).toHaveBeenCalledWith('campaign.old')
    })

    it('handles single-segment slug as ltree path', async () => {
      const rootNode: WikiNode = { ...existingNode, path: 'campaign' }
      mockFindByPath.mockResolvedValue(rootNode)
      mockGetDescendants.mockResolvedValue([])

      mountEditPage(['campaign'])
      await new Promise(r => setTimeout(r, 10))

      expect(mockFindByPath).toHaveBeenCalledWith('campaign')
    })

    it('calls WikiService.updateNode on save', async () => {
      mockFindByPath.mockResolvedValue(existingNode)
      mockGetDescendants.mockResolvedValue([])
      mockUpdateNode.mockResolvedValue({
        ...existingNode,
        title: 'Test Node',
        content: '# Hello',
        updatedAt: new Date(),
      })

      const wrapper = mountEditPage(['campaign', 'old'])
      await new Promise(r => setTimeout(r, 10))
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-testid="trigger-save"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockUpdateNode).toHaveBeenCalledWith('existing-1', {
        title: 'Test Node',
        content: '# Hello',
        path: 'test.hello',
      })
    })

    // ANTI-REGRESSION: should navigate after successful update
    it('should navigate to wiki viewer page after successful update', async () => {
      mockFindByPath.mockResolvedValue(existingNode)
      mockGetDescendants.mockResolvedValue([])
      mockUpdateNode.mockResolvedValue({
        ...existingNode,
        title: 'Test Node',
        content: '# Hello',
        path: 'test.hello',
        updatedAt: new Date(),
      })

      const wrapper = mountEditPage(['campaign', 'old'])
      await new Promise(r => setTimeout(r, 10))
      await wrapper.vm.$nextTick()

      await wrapper.find('[data-testid="trigger-save"]').trigger('click')
      await new Promise(r => setTimeout(r, 20))
      await wrapper.vm.$nextTick()

      expect(mockRouterPush).toHaveBeenCalledWith('/wiki/test/hello')
    })
  })
})
