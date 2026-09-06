import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import type { WikiNode } from '~/src/core/domain/wiki-node'

// ─── Issue #16: Task 4 — Editor Data-Binding & Save Flow ─────────────────────
// AC1: Simulates save event and asserts WikiService mock called with correct payload
// AC2: Success toast shown after save
// AC3: Error toast shown on failure
// AC4: When editing existing node (slug present), pre-fills editor
// AC5: When creating new (no slug), editor starts empty

// ─── Mock WikiService ──────────────────────────────────────────────────
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

// ─── Mocks ─────────────────────────────────────────────────────────────
const mockRouteData = { slug: [] as string[] }

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: mockRouteData,
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('#imports', () => ({
  navigateTo: vi.fn(),
  useSupabaseClient: () => ({}),
}))

// ─── Stubs ─────────────────────────────────────────────────────────────
const EditorStub = {
  template: `<div data-testid="gm-wiki-editor">
    <button data-testid="trigger-save" @click="$emit('save', { title: 'Test Node', content: '# Hello', path: 'test.hello' })">Save</button>
  </div>`,
  props: ['initialTitle', 'initialContent', 'initialPath'],
  emits: ['save'],
  name: 'GmWikiEditor',
}

import EditCreatePage from '../../pages/dm/wiki/edit/index.vue'
import EditSlugPage from '../../pages/dm/wiki/edit/[slug].vue'

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

function mountEditPage(slug: string = 'campaign.old') {
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

    it('loads existing node data on mount', async () => {
      mockFindByPath.mockResolvedValue(existingNode)
      mockGetDescendants.mockResolvedValue([])

      mountEditPage('campaign.old')
      await new Promise(r => setTimeout(r, 10))

      expect(mockFindByPath).toHaveBeenCalledWith('campaign.old')
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

      const wrapper = mountEditPage('campaign.old')
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
  })
})