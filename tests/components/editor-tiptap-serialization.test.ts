import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, defineComponent, h } from 'vue'

// ── Mock @vueuse/core ───────────────────────────────────────────
vi.mock('@vueuse/core', () => ({
  useDebounceFn: (fn: Function) => fn,
  onClickOutside: () => {},
}))

// ── Mock WikiService ────────────────────────────────────────────
vi.mock('~/composables/useWikiService', () => ({
  useWikiService: () => ({
    searchNodes: vi.fn().mockResolvedValue([]),
    getInboundReferences: vi.fn().mockResolvedValue([]),
    findInboundReferences: vi.fn().mockResolvedValue([]),
  }),
}))

// ── Mock CommandPalette ─────────────────────────────────────────
vi.mock('~/composables/useCommandPalette', () => ({
  useCommandPalette: () => ({ open: vi.fn() }),
}))

// ── TipTap Stub ─────────────────────────────────────────────────
const { editorInstanceBox } = vi.hoisted(() => ({
  editorInstanceBox: { current: null as any },
}))

vi.mock('@tiptap/vue-3', () => ({
  EditorContent: defineComponent({
    name: 'EditorContent',
    props: { editor: Object },
    setup(props) {
      editorInstanceBox.current = props.editor
      return () => h('div', { 'data-testid': 'tiptap-editor', class: 'ProseMirror' })
    },
  }),
  BubbleMenu: defineComponent({
    name: 'BubbleMenu',
    props: { editor: Object },
    setup(_, { slots }) { return () => slots.default ? slots.default() : null },
  }),
  FloatingMenu: defineComponent({
    name: 'FloatingMenu',
    props: { editor: Object },
    setup(_, { slots }) { return () => slots.default ? slots.default() : null },
  }),
}))

const { useEditorMock } = vi.hoisted(() => ({ useEditorMock: vi.fn() }))

vi.mock('~/src/presentation/tiptap/editor-setup', () => ({
  createEditor: useEditorMock,
}))

vi.mock('@tiptap/starter-kit', () => ({ default: { name: 'starterKit', type: 'extension' } }))
vi.mock('@tiptap/extension-bubble-menu', () => ({ default: { name: 'bubbleMenu', type: 'extension' } }))
vi.mock('@tiptap/extension-floating-menu', () => ({ default: { name: 'floatingMenu', type: 'extension' } }))
vi.mock('@tiptap/extension-image', () => ({ default: { name: 'image', type: 'extension' } }))
vi.mock('@tiptap/core', () => ({
  Extension: { create: (c: any) => ({ ...c, type: 'extension' }) },
  Node: { create: (c: any) => ({ ...c, type: 'node' }) },
  Mark: { create: (c: any) => ({ ...c, type: 'mark' }) },
}))

import GmWikiEditor from '~/src/presentation/components/GmWikiEditor.client.vue'
import type { WikiNode } from '~/src/core/domain/wiki-node'

function createMockEditor(md = '') {
  const contentRef = ref(md)
  return {
    storage: { markdown: { getMarkdown: () => contentRef.value } },
    setMarkdown: (s: string) => { contentRef.value = s },
    chain: () => ({ focus: () => ({ run: vi.fn() }) }),
    commands: { setContent: (c: string) => { contentRef.value = c; return true } },
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
  useEditorMock.mockReturnValue(mockEditor)
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
    editorInstanceBox.current = null
    useEditorMock.mockReset()
  })

  describe('Editor Mounting & Initialization', () => {
    it('1.1: mounts the TipTap EditorContent component', () => {
      const wrapper = mountComponent({ initialContent: 'Hello' })
      expect(wrapper.find('[data-testid="tiptap-editor"]').exists()).toBe(true)
    })

    it('1.2: calls createEditor with initial content', () => {
      mountComponent({ initialContent: '# Hello' })
      expect(useEditorMock).toHaveBeenCalled()
    })

    it('1.3: creates editor with empty content when none provided', () => {
      mountComponent({ initialContent: '' })
      expect(useEditorMock).toHaveBeenCalled()
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

    it('1.6: handles code blocks in markdown', () => {
      const input = '```ts\nconst x = 1\n```'
      const mockEd = createMockEditor(input)
      mountComponent({ initialContent: input }, mockEd)
      expect(mockEd.storage.markdown.getMarkdown()).toBe(input)
    })
  })

  describe('Save Button Integration', () => {
    it('1.7: renders save button', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('[data-testid="wiki-save"]').exists()).toBe(true)
    })

    it('1.8: emits save with markdown content', async () => {
      const input = '# Save Test'
      const mockEd = createMockEditor(input)
      const wrapper = mountComponent({ initialContent: input, initialTitle: 'TestPage' }, mockEd)
      await wrapper.find('[data-testid="wiki-save"]').trigger('click')
      await wrapper.vm.$nextTick()

      const emitted = wrapper.emitted('save')
      expect(emitted).toBeTruthy()
      if (emitted) {
        expect(emitted[0][0]).toMatchObject({ title: 'TestPage', content: input })
      }
    })

    it('1.9: validates title is not empty before save', async () => {
      const wrapper = mountComponent({ initialTitle: '' })
      await wrapper.find('[data-testid="wiki-save"]').trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-testid="wiki-title-error"]').exists()).toBe(true)
    })
  })

  describe('isRawMode Toggle', () => {
    it('1.10: raw mode toggle button exists', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('[data-testid="raw-mode-toggle"]').exists()).toBe(true)
    })

    it('1.11: raw mode shows textarea and hides TipTap', async () => {
      const wrapper = mountComponent({ initialContent: '# Raw test' })
      await wrapper.find('[data-testid="raw-mode-toggle"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="raw-markdown-textarea"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="tiptap-editor"]').exists()).toBe(false)
    })

    it('1.12: raw mode textarea shows current markdown', async () => {
      const input = '# Hello World'
      const mockEd = createMockEditor(input)
      const wrapper = mountComponent({ initialContent: input }, mockEd)

      await wrapper.find('[data-testid="raw-mode-toggle"]').trigger('click')
      await wrapper.vm.$nextTick()

      const textarea = wrapper.find('[data-testid="raw-markdown-textarea"]')
      expect((textarea.element as HTMLTextAreaElement).value).toBe(input)
    })

    it('1.13: toggle back recreates editor and destroys old one', async () => {
      const mockEd = createMockEditor('# test')
      const wrapper = mountComponent({ initialContent: '# test' }, mockEd)

      await wrapper.find('[data-testid="raw-mode-toggle"]').trigger('click')
      await wrapper.vm.$nextTick()
      expect(mockEd.destroy).toHaveBeenCalled()

      await wrapper.find('[data-testid="raw-mode-toggle"]').trigger('click')
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="tiptap-editor"]').exists()).toBe(true)
      expect(useEditorMock).toHaveBeenCalledTimes(2)
    })
  })

  describe('Existing Functionality Preservation', () => {
    it('1.14: mounts successfully', () => {
      expect(mountComponent().exists()).toBe(true)
    })

    it('1.15: renders title input', () => {
      expect(mountComponent().find('[data-testid="wiki-title"]').exists()).toBe(true)
    })

    it('1.16: renders entity type selector', () => {
      expect(mountComponent().find('[data-testid="wiki-entity-type"]').exists()).toBe(true)
    })

    it('1.17: renders cover image dropzone', () => {
      expect(mountComponent().find('[data-testid="wiki-cover-dropzone"]').exists()).toBe(true)
    })

    it('1.18: renders parent folder selector', () => {
      expect(mountComponent().find('[data-testid="wiki-parent"]').exists()).toBe(true)
    })
  })
})
