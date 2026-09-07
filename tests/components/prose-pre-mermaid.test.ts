// ─── Sprint 1.9: Task 2 — Native Vue Mermaid Renderer ───────────────
// Tests that ProsePre overrides renders MermaidRenderer for mermaid code blocks.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

// ─── Mock mermaid ────────────────────────────────────────────────────
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({
      svg: '<svg class="mermaid-rendered"><g>mock-diagram</g></svg>',
    }),
  },
}))

// ─── MermaidRenderer stub for testing ────────────────────────────────
const MermaidRendererStub = defineComponent({
  name: 'MermaidRenderer',
  props: { code: { type: String, required: true } },
  setup(props) {
    return () => h('div', { class: 'mermaid-container', 'data-testid': 'mermaid-renderer' }, props.code)
  },
})

// ─── Import the component under test ─────────────────────────────────
import ProsePre from '~/components/content/ProsePre.vue'

function mountProsePre(props: Record<string, unknown> = {}, slotContent = '') {
  return mount(ProsePre, {
    props: {
      code: (props.code as string) ?? '',
      language: (props.language as string) ?? null,
      filename: (props.filename as string) ?? null,
      highlights: (props.highlights as number[]) ?? [],
      meta: (props.meta as string) ?? null,
      class: (props.class as string) ?? null,
    },
    slots: slotContent ? { default: slotContent } : {},
    global: {
      stubs: { MermaidRenderer: MermaidRendererStub },
    },
  })
}

describe('Sprint 1.9: ProsePre override — Mermaid rendering', () => {
  it('renders default <pre> when language is not mermaid', () => {
    const wrapper = mountProsePre({ language: 'javascript', code: 'console.log("hi")' })
    expect(wrapper.find('pre').exists()).toBe(true)
    expect(wrapper.find('[data-testid="mermaid-renderer"]').exists()).toBe(false)
  })

  it('renders default <pre> when language is null', () => {
    const wrapper = mountProsePre({ language: null, code: 'plain text' })
    expect(wrapper.find('pre').exists()).toBe(true)
    expect(wrapper.find('[data-testid="mermaid-renderer"]').exists()).toBe(false)
  })

  it('renders MermaidRenderer when language is mermaid', () => {
    const wrapper = mountProsePre({ language: 'mermaid', code: 'graph TD\n  A-->B' })
    expect(wrapper.find('[data-testid="mermaid-renderer"]').exists()).toBe(true)
    expect(wrapper.find('pre').exists()).toBe(false)
  })

  it('passes code prop to MermaidRenderer', () => {
    const mermaidCode = 'graph TD\n  A-->B'
    const wrapper = mountProsePre({ language: 'mermaid', code: mermaidCode })
    expect(wrapper.find('[data-testid="mermaid-renderer"]').text()).toBe(mermaidCode)
  })

  it('renders slot content for non-mermaid code blocks', () => {
    const wrapper = mountProsePre({ language: 'typescript', code: 'const x = 1' }, '<code>const x = 1</code>')
    const pre = wrapper.find('pre')
    expect(pre.exists()).toBe(true)
    expect(pre.html()).toContain('<code>')
  })

  it('handles case-insensitive mermaid language', () => {
    const wrapper = mountProsePre({ language: 'Mermaid', code: 'graph TD' })
    expect(wrapper.find('[data-testid="mermaid-renderer"]').exists()).toBe(true)
  })

  it('preserves class prop on non-mermaid pre', () => {
    const wrapper = mountProsePre({ language: 'python', code: 'print("hi")', class: 'custom-class' })
    const pre = wrapper.find('pre')
    expect(pre.attributes('class')).toContain('custom-class')
  })
})