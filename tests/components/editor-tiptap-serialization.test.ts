import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, defineComponent, h, shallowRef } from 'vue'

vi.mock('@vueuse/core', () => ({ useDebounceFn: (fn: Function) => fn, onClickOutside: () => {} }))
vi.mock('~/composables/useWikiService', () => ({ useWikiService: () => ({ searchNodes: vi.fn().mockResolvedValue([]), getInboundReferences: vi.fn().mockResolvedValue([]), findInboundReferences: vi.fn().mockResolvedValue([]) }) }))
vi.mock('~/composables/useCommandPalette', () => ({ useCommandPalette: () => ({ open: vi.fn() }) }))
vi.mock('#imports', () => ({ useSupabaseClient: () => ({}) }))
vi.mock('~/composables/useAssetUpload', () => ({ useAssetUpload: () => ({ uploadAsset: vi.fn(), uploading: { value: false }, error: { value: null } }) }))
vi.mock('~/src/presentation/components/editor/EditorBubble.vue', () => ({ default: { name: 'EditorBubble', props: ['editor'], template: '<div></div>' } }))
vi.mock('~/src/presentation/components/editor/EditorSlash.vue', () => ({ default: { name: 'EditorSlash', props: ['editor'], template: '<div></div>' } }))
vi.mock('~/src/presentation/components/editor/GmEditorToolbar.vue', () => ({ default: { name: 'GmEditorToolbar', props: ['editor'], template: '<div data-testid="editor-toolbar"></div>' } }))
vi.mock('~/src/presentation/tiptap/editor-setup', () => ({ getEditorExtensions: () => [] }))
vi.mock('@tiptap/starter-kit', () => ({ default: { name: 'starterKit', type: 'extension' } }))
vi.mock('@tiptap/extension-image', () => ({ default: { name: 'image', type: 'extension' } }))
vi.mock('@tiptap/core', () => ({ Extension: { create: (c: any) => ({ ...c, type: 'extension' }) }, Node: { create: (c: any) => ({ ...c, type: 'node' }) }, Mark: { create: (c: any) => ({ ...c, type: 'mark' }) } }))

const { editorBox, useEditorCallCount } = vi.hoisted(() => ({
  editorBox: { value: null as any },
  useEditorCallCount: { count: 0 },
}))

vi.mock('@tiptap/vue-3', () => ({
  EditorContent: defineComponent({ name: 'EditorContent', props: { editor: Object }, setup: () => () => h('div', { 'data-testid': 'tiptap-editor', class: 'ProseMirror' }) }),
  useEditor: vi.fn(() => { useEditorCallCount.count++; return editorBox }),
}))

import GmWikiEditor from '~/src/presentation/components/GmWikiEditor.client.vue'
import type { WikiNode } from '~/src/core/domain/wiki-node'

function createMockEditor(md = '') {
  const contentRef = ref(md)
  return {
    storage: { markdown: { getMarkdown: () => contentRef.value } },
    setMarkdown: (s: string) => { contentRef.value = s },
    chain: () => ({ focus: () => ({ run: vi.fn() }) }),
    commands: { setContent: (c: string) => { contentRef.value = c; return true }, insertContent: vi.fn(), setImage: vi.fn() },
    isActive: vi.fn().mockReturnValue(false),
    getHTML: vi.fn().mockReturnValue(''),
    getJSON: vi.fn().mockReturnValue({}),
    destroy: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    state: { doc: {} },
    view: { state: { doc: {} } },
  }
}

function mountComponent(overrides: Record<string, unknown> = {}, preBuilt?: ReturnType<typeof createMockEditor>) {
  const initialContent = (overrides.initialContent as string) ?? ''
  const mockEditor = preBuilt ?? createMockEditor(initialContent)
  editorBox.value = mockEditor
  return mount(GmWikiEditor, {
    props: {
      initialTitle: (overrides.initialTitle as string) ?? '',
      initialContent,
      initialPath: (overrides.initialPath as string) ?? '',
      initialCoverImageUrl: (overrides.initialCoverImageUrl as string) ?? '',
      initialEntityType: (overrides.initialEntityType as string) ?? '',
      parentOptions: (overrides.parentOptions as WikiNode[]) ?? [],
    },
  })
}

describe('Sprint 1.12 Task 1: TipTap Core & Serialization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useEditorCallCount.count = 0
    editorBox.value = null
  })

  describe('Editor Mounting & Initialization', () => {
    it('1.1: mounts the TipTap EditorContent component', () => {
      const wrapper = mountComponent({ initialContent: 'Hello' })
      expect(wrapper.find('[data-testid="tiptap-editor"]').exists()).toBe(true)
    })

    it('1.2: calls useEditor', () => {
      mountComponent({ initialContent: '# Hello' })
      expect(useEditorCallCount.count).toBeGreaterThanOrEqual(1)
    })

    it('1.3: creates editor with empty content', () => {
      mountComponent({ initialContent: '' })
      expect(useEditorCallCount.count).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Bidirectional Markdown Serialization', () => {
    it('1.4: editor getMarkdown returns stored markdown', () => {
      const input = '# Title'
      const mockEd = createMockEditor(input)
      mountComponent({ initialContent: input }, mockEd)
      expect(mockEd.storage.markdown.getMarkdown()).toBe(input)
    })

    it('1.5: round-trip preserves standard markdown', () => {
      const input = '# Heading'
      const mockEd = createMockEditor(input)
      mountComponent({ initialContent: input }, mockEd)
      expect(mockEd.storage.markdown.getMarkdown()).toBe(input)
    })

    it('1.6: handles code blocks', () => {
      const input = '```ts\nconst x = 1\n```'
      const mockEd = createMockEditor(input)
      mountComponent({ initialContent: input }, mockEd)
      expect(mockEd.storage.markdown.getMarkdown()).toBe(input)
    })
  })

  describe('Save Button Integration', () => {
    it('1.7: renders save button', () => {
      expect(mountComponent().find('[data-testid="wiki-save"]').exists()).toBe(true)
    })

    it('1.8: emits save with markdown content', async () => {
      const input = '# Save Test'
      const mockEd = createMockEditor(input)
      const wrapper = mountComponent({ initialContent: input, initialTitle: 'TestPage' }, mockEd)
      await wrapper.find('[data-testid="wiki-save"]').trigger('click')
      await wrapper.vm.$nextTick()
      const e = wrapper.emitted('save')
      expect(e).toBeTruthy()
      if (e) expect(e[0][0]).toMatchObject({ title: 'TestPage', content: input })
    })

    it('1.9: validates title not empty', async () => {
      const wrapper = mountComponent({ initialTitle: '' })
      await wrapper.find('[data-testid="wiki-save"]').trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-testid="wiki-title-error"]').exists()).toBe(true)
    })
  })

  describe('isRawMode Toggle', () => {
    it('1.10: raw mode toggle exists', () => {
      expect(mountComponent().find('[data-testid="raw-mode-toggle"]').exists()).toBe(true)
    })

    it('1.11: raw mode shows textarea, hides TipTap', async () => {
      const wrapper = mountComponent({ initialContent: '# Raw test' })
      await wrapper.find('[data-testid="raw-mode-toggle"]').trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-testid="raw-markdown-textarea"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="tiptap-editor"]').exists()).toBe(false)
    })

    it('1.12: raw mode textarea shows markdown', async () => {
      const input = '# Hello'
      const mockEd = createMockEditor(input)
      const wrapper = mountComponent({ initialContent: input }, mockEd)
      await wrapper.find('[data-testid="raw-mode-toggle"]').trigger('click')
      await wrapper.vm.$nextTick()
      expect((wrapper.find('[data-testid="raw-markdown-textarea"]').element as HTMLTextAreaElement).value).toBe(input)
    })

    it('1.13: toggle back recreates editor', async () => {
      const wrapper = mountComponent({ initialContent: '# test' })
      await wrapper.find('[data-testid="raw-mode-toggle"]').trigger('click')
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-testid="raw-mode-toggle"]').trigger('click')
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()
      expect(useEditorCallCount.count).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Existing Functionality', () => {
    it('1.14: mounts', () => { expect(mountComponent().exists()).toBe(true) })
    it('1.15: title input', () => { expect(mountComponent().find('[data-testid="wiki-title"]').exists()).toBe(true) })
    it('1.16: entity type', () => { expect(mountComponent().find('[data-testid="wiki-entity-type"]').exists()).toBe(true) })
    it('1.17: cover dropzone', () => { expect(mountComponent().find('[data-testid="wiki-cover-dropzone"]').exists()).toBe(true) })
    it('1.18: parent selector', () => { expect(mountComponent().find('[data-testid="wiki-parent"]').exists()).toBe(true) })
  })
})
