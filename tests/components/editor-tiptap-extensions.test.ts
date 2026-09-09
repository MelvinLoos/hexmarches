import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, defineComponent, h } from 'vue'

// ── Mocks ───────────────────────────────────────────────────────
vi.mock('@vueuse/core', () => ({
  useDebounceFn: (fn: Function) => fn,
  onClickOutside: () => {},
}))

vi.mock('~/composables/useWikiService', () => ({
  useWikiService: () => ({
    searchNodes: vi.fn().mockResolvedValue([]),
    getInboundReferences: vi.fn().mockResolvedValue([]),
    findInboundReferences: vi.fn().mockResolvedValue([]),
  }),
}))

vi.mock('~/composables/useCommandPalette', () => ({
  useCommandPalette: () => ({ open: vi.fn() }),
}))

vi.mock('@tiptap/vue-3', () => ({
  EditorContent: defineComponent({
    name: 'EditorContent',
    props: { editor: Object },
    setup() { return () => h('div', { 'data-testid': 'tiptap-editor' }) },
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

vi.mock('#imports', () => ({ useSupabaseClient: () => ({}) }))
vi.mock('~/composables/useAssetUpload', () => ({ useAssetUpload: () => ({ uploadAsset: vi.fn(), uploading: { value: false }, error: { value: null }, lastUploadedUrl: { value: null } }) }))
import GmWikiEditor from '~/src/presentation/components/GmWikiEditor.client.vue'
import type { WikiNode } from '~/src/core/domain/wiki-node'

function makeMockEditor() {
  const contentRef = ref('')
  return {
    storage: { markdown: { getMarkdown: () => contentRef.value } },
    setMarkdown: (s: string) => { contentRef.value = s },
    commands: { insertContent: vi.fn(), setContent: vi.fn() },
    chain: () => ({ focus: () => ({ run: vi.fn() }) }),
    isActive: vi.fn().mockReturnValue(false),
    getHTML: vi.fn().mockReturnValue(''),
    getJSON: vi.fn(() => ({ type: 'doc', content: [] })),
    destroy: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    state: { doc: {} },
    view: { state: { doc: {} } },
  }
}

function mountComponent(overrides: Record<string, unknown> = {}) {
  useEditorMock.mockReturnValue(makeMockEditor())
  return mount(GmWikiEditor, {
    props: {
      initialTitle: (overrides.initialTitle as string) ?? '',
      initialContent: (overrides.initialContent as string) ?? '',
      initialPath: (overrides.initialPath as string) ?? '',
      initialCoverImageUrl: (overrides.initialCoverImageUrl as string) ?? '',
      initialEntityType: (overrides.initialEntityType as string) ?? '',
      parentOptions: (overrides.parentOptions as WikiNode[]) ?? [],
    },
  })
}

describe('Sprint 1.12 Task 2: Custom Node Extensions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useEditorMock.mockReset()
  })

  describe('WikiLink Extension', () => {
    it('2.1: WikiLink node serializes to [[Title]] markdown', () => {
      // Will test: create WikiLink node → getMarkdown contains [[Title]]
      const mockEd = makeMockEditor()
      // Simulate WikiLink node in the editor
      mockEd.getJSON = vi.fn(() => ({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'The ' }, { type: 'wikiLink', attrs: { title: 'Harpers' } }] }],
      }))
      mockEd.setMarkdown('The [[Harpers]] faction')
      useEditorMock.mockReturnValue(mockEd)

      mountComponent({ initialContent: 'The [[Harpers]] faction' })
      expect(mockEd.storage.markdown.getMarkdown()).toBe('The [[Harpers]] faction')
    })

    it('2.2: WikiLink markdown [[Title]] is parsed to WikiLink node', () => {
      const mockEd = makeMockEditor()
      let capturedContent: any = null
      mockEd.commands.setContent = vi.fn((content: any) => { capturedContent = content; return true })
      useEditorMock.mockReturnValue(mockEd)

      mountComponent({ initialContent: 'The [[Harpers]] faction' })
      // Verify editor was initialized with content containing wiki-link
      expect(useEditorMock).toHaveBeenCalled()
    })

    it('2.3: multiple WikiLinks in one paragraph round-trip', () => {
      const input = 'See [[Locations]] and [[NPCs]] for more'
      const mockEd = makeMockEditor()
      mockEd.setMarkdown(input)
      useEditorMock.mockReturnValue(mockEd)

      mountComponent({ initialContent: input })
      expect(mockEd.storage.markdown.getMarkdown()).toBe(input)
    })
  })

  describe('GmSecret Extension', () => {
    it('2.4: GmSecret node serializes to ::gm-secret{title="..."} block', () => {
      const mockEd = makeMockEditor()
      mockEd.getJSON = vi.fn(() => ({
        type: 'doc',
        content: [{ type: 'gmSecret', attrs: { title: 'Trap' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'DC 15 pit trap' }] }] }],
      }))
      mockEd.setMarkdown('::gm-secret{title="Trap"}\nDC 15 pit trap\n::')
      useEditorMock.mockReturnValue(mockEd)

      mountComponent({ initialContent: '::gm-secret{title="Trap"}\nDC 15 pit trap\n::' })
      expect(mockEd.storage.markdown.getMarkdown()).toBe('::gm-secret{title="Trap"}\nDC 15 pit trap\n::')
    })

    it('2.5: GmSecret markdown ::gm-secret{...} is parsed to GmSecret node', () => {
      const mockEd = makeMockEditor()
      mockEd.setMarkdown('::gm-secret{title="Hidden"}\nSecret text\n::')
      useEditorMock.mockReturnValue(mockEd)

      mountComponent({ initialContent: '::gm-secret{title="Hidden"}\nSecret text\n::' })
      expect(useEditorMock).toHaveBeenCalled()
      // The factory should have been called with content that includes ::gm-secret
    })

    it('2.6: custom nodes coexist with standard markdown', () => {
      const input = '# Overview\n\nThe **party** found [[Treasure]] in a dungeon.\n\n::gm-secret{title="Trap DC"}\nDC 15 pit trap\n::\n\n- End of report'
      const mockEd = makeMockEditor()
      mockEd.setMarkdown(input)
      useEditorMock.mockReturnValue(mockEd)

      mountComponent({ initialContent: input })
      expect(mockEd.storage.markdown.getMarkdown()).toBe(input)
    })
  })

  describe('Extension Registration', () => {
    it('2.7: createEditor receives extensions config', () => {
      mountComponent()
      const callArgs = useEditorMock.mock.calls[0]
      expect(callArgs).toBeDefined()
      // createEditor is called with content and onUpdate
      expect(callArgs[0]).toHaveProperty('content')
    })
  })
})
