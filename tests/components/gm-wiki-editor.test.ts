import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import GmWikiEditor from '~/src/presentation/components/GmWikiEditor.client.vue'

vi.mock('md-editor-v3', () => ({
  MdEditor: defineComponent({
    name: 'MdEditor',
    props: {
      modelValue: String,
      theme: String,
      language: String,
      previewTheme: String,
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('div', { 'data-testid': 'md-editor' }, [
          h('textarea', {
            value: props.modelValue,
            'data-testid': 'editor-textarea',
            onInput: (e: Event) =>
              emit('update:modelValue', (e.target as HTMLTextAreaElement).value),
          }),
        ])
    },
  }),
}))

function mountComponent(initialTitle = '', initialContent = '', initialPath = '') {
  return mount(GmWikiEditor, {
    props: { initialTitle, initialContent, initialPath },
  })
}
describe('GmWikiEditor.vue', () => {
  it('mounts successfully', () => {
    const wrapper = mountComponent()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders md-editor mock', () => {
    const wrapper = mountComponent()
    expect(wrapper.find('[data-testid="md-editor"]').exists()).toBe(true)
  })

  it('renders title input', () => {
    const wrapper = mountComponent()
    expect(wrapper.find('[data-testid="wiki-title"]').exists()).toBe(true)
  })

  it('renders path input', () => {
    const wrapper = mountComponent()
    expect(wrapper.find('[data-testid="wiki-path"]').exists()).toBe(true)
  })

  it('renders save button', () => {
    const wrapper = mountComponent()
    expect(wrapper.find('[data-testid="wiki-save"]').exists()).toBe(true)
  })

  it('emits save payload with title, content, and path', async () => {
    const wrapper = mountComponent()
    await wrapper.find('[data-testid="wiki-title"]').setValue('Dark Forest')
    await wrapper.find('[data-testid="editor-textarea"]').setValue('# Content')
    await wrapper.find('[data-testid="wiki-path"]').setValue('campaign.locations.forest')
    await wrapper.find('[data-testid="wiki-save"]').trigger('click')
    const saveEvents = wrapper.emitted('save')
    expect(saveEvents).toBeDefined()
    expect(saveEvents![0][0]).toEqual({
      title: 'Dark Forest',
      content: '# Content',
      path: 'campaign.locations.forest',
    })
  })

  it('binds initial props', () => {
    const wrapper = mountComponent('Prefilled', '# Content', 'prefilled.path')
    const el = wrapper.find('[data-testid="wiki-title"]').element as HTMLInputElement
    expect(el.value).toBe('Prefilled')
  })
})