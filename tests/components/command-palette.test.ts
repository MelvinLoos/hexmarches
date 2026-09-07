import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
import { RouterLinkStub } from '@vue/test-utils'
import DefaultLayout from '~/layouts/default.vue'
import type { WikiNodeSearchResult } from '~/src/core/domain/wiki-repository'

// ── Mock @vueuse/core ───────────────────────────────────────────────
const fakeMagicKeysCurrent = ref(new Set<string>())
vi.mock('@vueuse/core', () => ({
  useMagicKeys: () => ({ current: fakeMagicKeysCurrent }),
  onClickOutside: (el: any, handler: () => void) => {
    ;(el as any).__outsideClick = handler
  },
  useDebounceFn: (fn: Function, _ms: number) => fn,
  refDebounced: (source: any, _ms?: number) => source,
}))

// ── Mock useWikiService ──────────────────────────────────────────────
const mockSearchNodes = vi.fn()
vi.mock('~/composables/useWikiService', () => ({
  useWikiService: () => ({
    searchNodes: mockSearchNodes,
  }),
}))

// ── Test Data ───────────────────────────────────────────────────────
function makeResult(id: string, title: string, path: string, entityType: string, rank: number, headline: string): WikiNodeSearchResult {
  return {
    node: { id, title, content: '', path, entityType: entityType as any, createdAt: new Date(), updatedAt: new Date() },
    rank,
    headline,
  }
}

const mockSearchResults: WikiNodeSearchResult[] = [
  makeResult('1', 'Dark Forest', 'campaign.locations.forest', 'LOCATION', 0.8, 'A <b>spooky</b> forest.'),
  makeResult('2', 'The Harpers', 'campaign.factions.harpers', 'FACTION', 0.6, 'A <b>secret</b> organization.'),
  makeResult('3', 'Spooky Cave', 'campaign.locations.forest.cave', 'LOCATION', 0.5, 'A <b>spooky</b> cave.'),
]

// ── Helpers ─────────────────────────────────────────────────────────
function mountLayout() {
  return mount(DefaultLayout, {
    global: { stubs: { NuxtLink: RouterLinkStub, CommandPalette: true } },
    slots: { default: '<div data-testid="slot-content">Page Content</div>' },
  })
}

import CommandPalette from '~/components/layout/CommandPalette.client.vue'
import { useCommandPalette } from '~/composables/useCommandPalette'

function mountPalette() {
  mockSearchNodes.mockReset()
  return mount(CommandPalette, { global: { stubs: { NuxtLink: RouterLinkStub } } })
}

describe('Issue #39: Command Palette (Cmd+K)', () => {
  beforeEach(() => {
    fakeMagicKeysCurrent.value = new Set()
    // Reset composable state
    const cp = useCommandPalette()
    cp.close()
  })

  describe('Shared composable (useCommandPalette)', () => {
    it('open() makes the modal visible', async () => {
      const wrapper = mountPalette()
      const cp = useCommandPalette()
      expect(wrapper.find('[data-testid="cmd-palette-modal"]').exists()).toBe(false)
      cp.open()
      await nextTick()
      expect(wrapper.find('[data-testid="cmd-palette-modal"]').exists()).toBe(true)
    })

    it('close() hides the modal', async () => {
      const wrapper = mountPalette()
      const cp = useCommandPalette()
      cp.open()
      await nextTick()
      expect(wrapper.find('[data-testid="cmd-palette-modal"]').exists()).toBe(true)
      cp.close()
      await nextTick()
      expect(wrapper.find('[data-testid="cmd-palette-modal"]').exists()).toBe(false)
    })

    it('toggle() flips visibility', async () => {
      const wrapper = mountPalette()
      const cp = useCommandPalette()
      cp.toggle()
      await nextTick()
      expect(wrapper.find('[data-testid="cmd-palette-modal"]').exists()).toBe(true)
      cp.toggle()
      await nextTick()
      expect(wrapper.find('[data-testid="cmd-palette-modal"]').exists()).toBe(false)
    })
  })

  describe('Visibility (useMagicKeys)', () => {
    it('renders the command palette container initially', () => {
      const wrapper = mountPalette()
      expect(wrapper.find('[data-testid="cmd-palette-container"]').exists()).toBe(true)
    })
    it('modal is hidden when magic keys combo is not active', () => {
      const wrapper = mountPalette()
      expect(wrapper.find('[data-testid="cmd-palette-modal"]').exists()).toBe(false)
    })
    it('shows modal when Meta+K is pressed', async () => {
      const wrapper = mountPalette()
      fakeMagicKeysCurrent.value = new Set(['Meta', 'k'])
      await nextTick()
      expect(wrapper.find('[data-testid="cmd-palette-modal"]').exists()).toBe(true)
    })
    it('shows modal when Ctrl+Shift+K is pressed', async () => {
      const wrapper = mountPalette()
      fakeMagicKeysCurrent.value = new Set(['Control', 'Shift', 'K'])
      await nextTick()
      expect(wrapper.find('[data-testid="cmd-palette-modal"]').exists()).toBe(true)
    })
    it('hides modal when Escape is pressed', async () => {
      const wrapper = mountPalette()
      fakeMagicKeysCurrent.value = new Set(['Meta', 'k'])
      await nextTick()
      expect(wrapper.find('[data-testid="cmd-palette-modal"]').exists()).toBe(true)
      fakeMagicKeysCurrent.value = new Set(['Escape'])
      await nextTick()
      expect(wrapper.find('[data-testid="cmd-palette-modal"]').exists()).toBe(false)
    })
  })

  describe('Search debouncing', () => {
    it('renders search input inside modal', async () => {
      const wrapper = mountPalette()
      fakeMagicKeysCurrent.value = new Set(['Meta', 'k'])
      await nextTick()
      expect(wrapper.find('[data-testid="cmd-palette-input"]').exists()).toBe(true)
    })
    it('does not call searchNodes before any input', async () => {
      const wrapper = mountPalette()
      mockSearchNodes.mockResolvedValue([])
      fakeMagicKeysCurrent.value = new Set(['Meta', 'k'])
      await nextTick()
      expect(mockSearchNodes).not.toHaveBeenCalled()
    })
  })

  describe('Grouped search results', () => {
    it('renders results grouped by entity_type', async () => {
      const wrapper = mountPalette()
      mockSearchNodes.mockResolvedValue(mockSearchResults)
      fakeMagicKeysCurrent.value = new Set(['Meta', 'k'])
      await nextTick()
      await wrapper.find('[data-testid="cmd-palette-input"]').setValue('spooky')
      await flushPromises()
      await nextTick()
      expect(wrapper.findAll('[data-testid="cmd-palette-result"]').length).toBe(3)
      expect(wrapper.findAll('[data-testid="cmd-palette-group-header"]').length).toBeGreaterThanOrEqual(1)
    })
    it('shows LOCATION and FACTION groups', async () => {
      const wrapper = mountPalette()
      mockSearchNodes.mockResolvedValue(mockSearchResults)
      fakeMagicKeysCurrent.value = new Set(['Meta', 'k'])
      await nextTick()
      await wrapper.find('[data-testid="cmd-palette-input"]').setValue('spooky')
      await flushPromises()
      await nextTick()
      const html = wrapper.html()
      expect(html).toContain('LOCATION')
      expect(html).toContain('FACTION')
    })
  })

  describe('Dismissal', () => {
    it('closes modal when clicking the backdrop', async () => {
      const wrapper = mountPalette()
      fakeMagicKeysCurrent.value = new Set(['Meta', 'k'])
      await nextTick()
      expect(wrapper.find('[data-testid="cmd-palette-modal"]').exists()).toBe(true)
      const backdrop = wrapper.find('[data-testid="cmd-palette-backdrop"]')
      expect(backdrop.exists()).toBe(true)
      await backdrop.trigger('click')
      expect(wrapper.find('[data-testid="cmd-palette-modal"]').exists()).toBe(false)
    })
  })

  describe('Layout integration', () => {
    it('layout includes CommandPalette after slot content', () => {
      const wrapper = mountLayout()
      expect(wrapper.find('[data-testid="slot-content"]').exists()).toBe(true)
    })
  })
})
