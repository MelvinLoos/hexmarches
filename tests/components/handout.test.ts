import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Handout from '../../components/content/Handout.vue'

describe('Handout.vue', () => {
  it('renders title prop', () => {
    const wrapper = mount(Handout, {
      props: { title: 'Secret Letter', content: 'Read carefully.' },
    })
    expect(wrapper.text()).toContain('Secret Letter')
  })

  it('renders content prop', () => {
    const wrapper = mount(Handout, {
      props: { title: 'Note', content: 'Important message here.' },
    })
    expect(wrapper.text()).toContain('Important message here.')
  })

  it('has handout class for styling', () => {
    const wrapper = mount(Handout, {
      props: { title: 'Test', content: 'Content' },
    })
    expect(wrapper.find('.handout-card').exists()).toBe(true)
  })

  it('renders both title and content together', () => {
    const wrapper = mount(Handout, {
      props: { title: 'Test Title', content: 'Test Content' },
    })
    const html = wrapper.html()
    expect(html).toContain('Test Title')
    expect(html).toContain('Test Content')
  })
})