import { describe, it, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import DefaultLayout from '../../layouts/default.vue'

// ─── Issue #14: Task 1 — Global Layout & Main Navigation ────────────────
// AC1: Layout renders the two navigation links (Wiki, GM Dashboard)
// AC2: Layout renders a <slot /> for page content

describe('Issue #14: Global Layout & Main Navigation', () => {
  it('renders Wiki navigation link', () => {
    const wrapper = mount(DefaultLayout, {
      global: {
        stubs: { NuxtLink: RouterLinkStub },
      },
    })
    const links = wrapper.findAllComponents(RouterLinkStub)
    const wikiLink = links.find(link => link.props().to === '/wiki')
    expect(wikiLink).toBeDefined()
    expect(wikiLink?.text()).toBe('Wiki')
  })

  it('renders GM Dashboard navigation link', () => {
    const wrapper = mount(DefaultLayout, {
      global: {
        stubs: { NuxtLink: RouterLinkStub },
      },
    })
    const links = wrapper.findAllComponents(RouterLinkStub)
    const dmLink = links.find(link => link.props().to === '/dm')
    expect(dmLink).toBeDefined()
    expect(dmLink?.text()).toContain('Dashboard')
  })

  it('renders slot content', () => {
    const wrapper = mount(DefaultLayout, {
      global: {
        stubs: { NuxtLink: RouterLinkStub },
      },
      slots: {
        default: '<div data-testid="slot-content">Slot Content</div>',
      },
    })
    expect(wrapper.find('[data-testid="slot-content"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="slot-content"]').text()).toBe('Slot Content')
  })

  it('renders the app title HexMarches', () => {
    const wrapper = mount(DefaultLayout, {
      global: {
        stubs: { NuxtLink: RouterLinkStub },
      },
    })
    expect(wrapper.text()).toContain('HexMarches')
  })
})