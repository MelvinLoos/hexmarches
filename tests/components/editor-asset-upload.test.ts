import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, defineComponent, h } from 'vue'

vi.mock('@vueuse/core', () => ({ useDebounceFn: (fn: Function) => fn, onClickOutside: () => {} }))
vi.mock('~/composables/useWikiService', () => ({ useWikiService: () => ({ searchNodes: vi.fn().mockResolvedValue([]), getInboundReferences: vi.fn().mockResolvedValue([]), findInboundReferences: vi.fn().mockResolvedValue([]) }) }))
vi.mock('~/composables/useCommandPalette', () => ({ useCommandPalette: () => ({ open: vi.fn() }) }))

vi.mock('@tiptap/vue-3', () => ({
  EditorContent: defineComponent({ name: 'EditorContent', props: { editor: Object }, setup() { return () => h('div', { 'data-testid': 'tiptap-editor' }) } }),
  BubbleMenu: defineComponent({ name: 'BubbleMenu', props: { editor: Object }, setup(_, { slots }) { return () => slots.default ? slots.default() : null } }),
  FloatingMenu: defineComponent({ name: 'FloatingMenu', props: { editor: Object }, setup(_, { slots }) { return () => slots.default ? slots.default() : null } }),
}))

const { useEditorMock } = vi.hoisted(() => ({ useEditorMock: vi.fn() }))
vi.mock('~/src/presentation/tiptap/editor-setup', () => ({ createEditor: useEditorMock }))
vi.mock('@tiptap/starter-kit', () => ({ default: { name: 'starterKit', type: 'extension' } }))
vi.mock('@tiptap/extension-bubble-menu', () => ({ default: { name: 'bubbleMenu', type: 'extension' } }))
vi.mock('@tiptap/extension-floating-menu', () => ({ default: { name: 'floatingMenu', type: 'extension' } }))
vi.mock('@tiptap/extension-image', () => ({ default: { name: 'image', type: 'extension' } }))
vi.mock('@tiptap/core', () => ({ Extension: { create: (c: any) => ({ ...c, type: 'extension' }) }, Node: { create: (c: any) => ({ ...c, type: 'node' }) }, Mark: { create: (c: any) => ({ ...c, type: 'mark' }) } }))

vi.mock('#imports', () => ({ useSupabaseClient: () => ({}) }))
vi.mock('~/composables/useAssetUpload', () => ({ useAssetUpload: () => ({ uploadAsset: vi.fn(), uploading: { value: false }, error: { value: null }, lastUploadedUrl: { value: null } }) }))
import GmWikiEditor from '~/src/presentation/components/GmWikiEditor.client.vue'
import type { WikiNode } from '~/src/core/domain/wiki-node'

function makeMockEditor() {
  return {
    storage: { markdown: { getMarkdown: vi.fn(() => '') } },
    commands: { insertContent: vi.fn(), setContent: vi.fn() },
    chain: () => ({ focus: () => ({ run: vi.fn() }) }),
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

describe('Sprint 1.12 Task 4: Asset Upload Interception', () => {
  beforeEach(() => { vi.clearAllMocks(); useEditorMock.mockReset() })

  it('4.1: component mounts successfully', () => {
    expect(mountComponent().exists()).toBe(true)
  })

  it('4.2: emits uploadImage event on cover image drop', async () => {
    const wrapper = mountComponent()
    const dropzone = wrapper.find('[data-testid="wiki-cover-dropzone"]')
    expect(dropzone.exists()).toBe(true)

    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const dataTransfer = { files: [file], types: ['Files'] }
    await dropzone.trigger('drop', { dataTransfer, preventDefault: vi.fn() })
    await wrapper.vm.$nextTick()

    const emitted = wrapper.emitted('uploadImage')
    expect(emitted).toBeTruthy()
    if (emitted) {
      expect(emitted[0][0]).toBeInstanceOf(File)
      expect(emitted[0][1]).toBeInstanceOf(Function)
    }
  })
})
