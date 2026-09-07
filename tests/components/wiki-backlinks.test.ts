import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, RouterLinkStub, flushPromises } from '@vue/test-utils'
import WikiBacklinks from '~/components/wiki/WikiBacklinks.vue'
import type { WikiNode } from '~/src/core/domain/wiki-node'

// ── Mock useWikiService ──────────────────────────────────────────────
const mockFindInbound = vi.fn()
vi.mock('~/composables/useWikiService', () => ({
  useWikiService: () => ({
    getInboundReferences: mockFindInbound,
    findInboundReferences: mockFindInbound,
  }),
}))

// ── Test Data ───────────────────────────────────────────────────────
function makeNode(overrides: Partial<WikiNode> = {}): WikiNode {
  return {
    id: overrides.id ?? '1',
    title: overrides.title ?? 'Test',
    content: overrides.content ?? '',
    path: overrides.path ?? 'test',
    entityType: overrides.entityType,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
  }
}

const mockBacklinks: WikiNode[] = [
  makeNode({ id: '1', title: 'Session 4 Notes', path: 'campaign.sessions.session4', content: 'Party explored [[Dark Forest]].' }),
  makeNode({ id: '2', title: 'NPCs', path: 'campaign.npcs', content: 'See also [[Dark Forest]].' }),
  makeNode({ id: '3', title: 'Gandalf', path: 'campaign.npcs.gandalf', content: 'Lives near [[Dark Forest]].' }),
]

function mountBacklinks(title: string, mockResult: WikiNode[] = []) {
  mockFindInbound.mockReset()
  mockFindInbound.mockResolvedValue(mockResult)
  return mount(WikiBacklinks, {
    props: { title },
    global: { stubs: { NuxtLink: RouterLinkStub } },
  })
}

describe('Issue #40: WikiBacklinks.vue', () => {
  beforeEach(() => {
    mockFindInbound.mockResolvedValue([])
  })

  it('renders the component when title is provided', () => {
    const wrapper = mountBacklinks('Dark Forest')
    expect(wrapper.find('[data-testid="wiki-backlinks"]').exists()).toBe(true)
  })

  it('does not render when title is empty', () => {
    mockFindInbound.mockResolvedValue([])
    const wrapper = mountBacklinks('')
    // Should show nothing or minimal UI
    expect(wrapper.find('[data-testid="wiki-backlinks-results"]').exists()).toBe(false)
  })

  it('renders the section heading "Referenced By"', async () => {
    const wrapper = mountBacklinks('Dark Forest', mockBacklinks)
    await flushPromises()
    expect(wrapper.text()).toContain('Referenced By')
  })

  it('renders backlink items as NuxtLinks', async () => {
    const wrapper = mountBacklinks('Dark Forest', mockBacklinks)
    await flushPromises()
    const items = wrapper.findAll('[data-testid="backlink-item"]')
    expect(items.length).toBe(3)
    expect(wrapper.text()).toContain('Session 4 Notes')
    expect(wrapper.text()).toContain('NPCs')
    expect(wrapper.text()).toContain('Gandalf')
  })

  it('shows empty state when no backlinks found', async () => {
    const wrapper = mountBacklinks('Unique Page', [])
    await flushPromises()
    expect(wrapper.find('[data-testid="backlink-empty"]').exists()).toBe(true)
  })

  it('fetches data on mount with the provided title', () => {
    mountBacklinks('Dark Forest', mockBacklinks)
    expect(mockFindInbound).toHaveBeenCalledWith('Dark Forest')
  })
})
