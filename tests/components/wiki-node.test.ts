import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import WikiNodeView from '~/src/presentation/components/WikiNodeView.vue'
import MonsterStatBlock from '~/src/presentation/components/MonsterStatBlock.vue'
import type { WikiNode } from '~/src/presentation/types/wiki'

vi.mock('@nuxtjs/mdc', () => ({
  MDCRenderer: vi.fn().mockImplementation(() => ({ render: vi.fn() })),
}))

describe('Issue #6: Presentation — Wiki MDC Components', () => {
  describe('WikiNode type', () => {
    it('should define a WikiNode with ltree path', () => {
      const node: WikiNode = {
        id: 'wn-1', title: 'Chapter 1: The Beginning',
        content: '# Welcome', path: 'campaign.chapter1',
        createdAt: new Date(), updatedAt: new Date(),
      }
      expect(node.path).toBe('campaign.chapter1')
    })

    it('should support hierarchical ltree paths', () => {
      const parent: WikiNode = {
        id: 'wn-root', title: 'Campaign', content: '',
        path: 'campaign', children: ['wn-child'],
        createdAt: new Date(), updatedAt: new Date(),
      }
      const child: WikiNode = {
        id: 'wn-child', title: 'Chapter 1', content: '',
        path: 'campaign.chapter1', parentId: 'wn-root',
        createdAt: new Date(), updatedAt: new Date(),
      }
      expect(child.parentId).toBe('wn-root')
      expect(parent.children).toContain('wn-child')
    })
  })

  describe('WikiNodeView component', () => {
    it('should render a wiki node title', () => {
      const node: WikiNode = {
        id: '1', title: 'Test Node', content: '<p>Hello</p>',
        path: 'test', createdAt: new Date(), updatedAt: new Date(),
      }
      const wrapper = mount(WikiNodeView, { props: { node } })
      expect(wrapper.find('h2').text()).toBe('Test Node')
    })

    it('should render wiki node content', () => {
      const node: WikiNode = {
        id: '1', title: 'T', content: '<p>Hello World</p>',
        path: 't', createdAt: new Date(), updatedAt: new Date(),
      }
      const wrapper = mount(WikiNodeView, { props: { node } })
      expect(wrapper.find('.wiki-content').html()).toContain('Hello World')
    })
  })

  describe('MonsterStatBlock custom component', () => {
    it('should render with name, hp, and ac', () => {
      const wrapper = mount(MonsterStatBlock, {
        props: { name: 'Dragon', hp: 200, ac: 18 },
      })
      expect(wrapper.text()).toContain('Dragon')
      expect(wrapper.text()).toContain('HP:200')
      expect(wrapper.text()).toContain('AC:18')
    })
  })

  describe('MDC integration', () => {
    it('should have MDCRenderer mock available', async () => {
      const mdc = await import('@nuxtjs/mdc')
      expect(mdc.MDCRenderer).toBeDefined()
    })
  })
})