import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'

// ── Mock shared page tree composable ──────────────────────────────
vi.mock('~/composables/useWikiPageTree', () => {
  const titlePathMap = {
    value: new Map<string, string>([
      ['Gandalf', 'campaign.npcs.gandalf'],
      ['Dark Forest', 'campaign.locations.forest'],
      ['The Harpers', 'campaign.factions.harpers'],
    ]),
  }
  return {
    useWikiPageTree: () => ({
      titlePathMap,
      tree: { value: [] },
      ensureLoaded: async () => {},
      findNodeByTitle: (title: string) => titlePathMap.value.has(title)
        ? { id: '1', title, path: titlePathMap.value.get(title)!, content: '', createdAt: new Date(), updatedAt: new Date() }
        : undefined,
    }),
  }
})

import WikiLink from '~/components/content/WikiLink.vue'

function mountLink(title: string) {
  return mount(WikiLink, {
    props: { title },
    global: { stubs: { NuxtLink: RouterLinkStub } },
  })
}

describe('Issue #43: WikiLink.vue — Dynamic Path Resolution', () => {
  it('resolves Gandalf to full ltree path /wiki/campaign/npcs/gandalf', () => {
    const wrapper = mountLink('Gandalf')
    const link = wrapper.findComponent(RouterLinkStub)
    expect(link.exists()).toBe(true)
    expect(link.props('to')).toBe('/wiki/campaign/npcs/gandalf')
  })

  it('resolves The Harpers to /wiki/campaign/factions/harpers', () => {
    const wrapper = mountLink('The Harpers')
    const link = wrapper.findComponent(RouterLinkStub)
    expect(link.props('to')).toBe('/wiki/campaign/factions/harpers')
  })

  it('renders broken-link style for unknown title (no tree match)', () => {
    const wrapper = mountLink('Nonexistent Character')
    const brokenLink = wrapper.find('[data-testid="wiki-link-broken"]')
    expect(brokenLink.exists()).toBe(true)
    expect(brokenLink.text()).toContain('Nonexistent Character')
  })

  it('displays the title text inside the NuxtLink', () => {
    const wrapper = mountLink('Gandalf')
    expect(wrapper.text()).toContain('Gandalf')
  })
})
