import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import Handout from '../../components/content/Handout.vue'
import WikiRenderer from '~/presentation/components/WikiRenderer.vue'

function parseBlocks(value: string) {
  const blocks: { title: string; content: string }[] = []
  const re = /::handout\{title="([^"]*)"(?:\s+content="([^"]*)")?\s*\}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(value)) !== null) {
    blocks.push({ title: m[1], content: m[2] ?? '' })
  }
  return blocks
}

const StubMDC = defineComponent({
  name: 'MDC',
  props: { value: { type: String, required: true }, tag: { type: String, default: 'div' } },
  setup(props) {
    return () => {
      const children: ReturnType<typeof h>[] = []
      for (const block of parseBlocks(props.value)) {
        children.push(h(Handout, { title: block.title, content: block.content }))
      }
      const plain = props.value.replace(/::handout\{[^}]*\}\n?/g, '').trim()
      if (plain) children.push(h('p', plain))
      if (children.length === 0) children.push(h('p', ''))
      return h(props.tag, { class: 'mdc-rendered' }, children)
    }
  },
})

function mountRenderer(content: string) {
  return mount(WikiRenderer, {
    props: { content },
    global: { stubs: { MDC: StubMDC } },
  })
}

describe('Issue #13: Migrate WikiRenderer to MDC', () => {
  it('renders Handout from ::handout syntax', () => {
    const wrapper = mountRenderer('::handout{title="Secret" content="Read."}')
    const cards = wrapper.findAll('.handout-card')
    expect(cards.length).toBe(1)
    expect(cards[0].text()).toContain('Secret')
  })

  it('renders multiple handouts', () => {
    const wrapper = mountRenderer(
      '::handout{title="A" content="1"}\n::handout{title="B" content="2"}'
    )
    expect(wrapper.findAll('.handout-card').length).toBe(2)
  })

  it('renders plain text alongside handouts', () => {
    const wrapper = mountRenderer('Some intro.\n::handout{title="Note" content="Msg."}')
    expect(wrapper.findAll('.handout-card').length).toBe(1)
    expect(wrapper.html()).toContain('Some intro')
  })

  it('renders basic content without handouts', () => {
    const wrapper = mountRenderer('# Hello World')
    expect(wrapper.html()).toContain('Hello World')
  })

  it('handles empty content', () => {
    const wrapper = mountRenderer('')
    expect(wrapper.exists()).toBe(true)
  })
})
