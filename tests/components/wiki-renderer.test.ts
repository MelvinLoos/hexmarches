import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WikiRenderer from '~/presentation/components/WikiRenderer.vue'

describe('WikiRenderer.vue', () => {
  it('mounts successfully', () => {
    const wrapper = mount(WikiRenderer, {
      props: { content: '# Hello World' },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders markdown heading', () => {
    const wrapper = mount(WikiRenderer, {
      props: { content: '# Test Heading' },
    })
    expect(wrapper.html()).toContain('Test Heading')
  })

  it('renders markdown paragraph', () => {
    const wrapper = mount(WikiRenderer, {
      props: { content: 'Just a paragraph of text.' },
    })
    expect(wrapper.html()).toContain('Just a paragraph of text.')
  })

  it('renders bold and italic markdown', () => {
    const wrapper = mount(WikiRenderer, {
      props: { content: '**bold** and *italic*' },
    })
    const html = wrapper.html()
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>italic</em>')
  })

  it('handles empty content gracefully', () => {
    const wrapper = mount(WikiRenderer, {
      props: { content: '' },
    })
    expect(wrapper.exists()).toBe(true)
  })
})