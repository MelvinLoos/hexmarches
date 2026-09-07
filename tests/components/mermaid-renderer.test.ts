// ─── Sprint 1.9: Task 2 — MermaidRenderer Component ──────────────────
// Tests that MermaidRenderer handles ClientOnly wrapping and code prop.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MermaidRenderer from '~/components/content/MermaidRenderer.vue'

// ─── Mock mermaid module ─────────────────────────────────────────────
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({
      svg: '<svg class="mermaid-rendered"><g>mock-diagram</g></svg>',
    }),
  },
}))

// ─── Stub ClientOnly to render its default slot ──────────────────────
const ClientOnlyStub = {
  template: '<div><slot /></div>',
  props: ['fallbackTag', 'placeholderTag', 'fallback'],
}

describe('Sprint 1.9: MermaidRenderer component', () => {
  it('mounts successfully', () => {
    const wrapper = mount(MermaidRenderer, {
      props: { code: 'graph TD' },
      global: {
        stubs: { ClientOnly: ClientOnlyStub },
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the mermaid-renderer container', () => {
    const wrapper = mount(MermaidRenderer, {
      props: { code: 'graph TD' },
      global: {
        stubs: { ClientOnly: ClientOnlyStub },
      },
    })
    expect(wrapper.find('.mermaid-renderer').exists()).toBe(true)
  })

  it('renders the mermaid SVG after mount', async () => {
    const wrapper = mount(MermaidRenderer, {
      props: { code: 'graph TD' },
      global: {
        stubs: { ClientOnly: ClientOnlyStub },
      },
    })

    // Wait for the async render
    await new Promise((r) => setTimeout(r, 50))
    await wrapper.vm.$nextTick()

    const html = wrapper.html()
    expect(html).toContain('mock-diagram')
  })

  it('handles empty code prop gracefully', () => {
    const wrapper = mount(MermaidRenderer, {
      props: { code: '' },
      global: {
        stubs: { ClientOnly: ClientOnlyStub },
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('shows error message when mermaid.render fails', async () => {
    const mermaid = await import('mermaid')
    ;(mermaid.default.render as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Parse error')
    )

    const wrapper = mount(MermaidRenderer, {
      props: { code: 'invalid syntax' },
      global: {
        stubs: { ClientOnly: ClientOnlyStub },
      },
    })

    await new Promise((r) => setTimeout(r, 50))
    await wrapper.vm.$nextTick()

    const html = wrapper.html()
    expect(html).toContain('mermaid-error')
    expect(html).toContain('Parse error')
  })
})