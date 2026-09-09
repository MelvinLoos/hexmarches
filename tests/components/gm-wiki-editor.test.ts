import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import GmWikiEditor from '~/src/presentation/components/GmWikiEditor.client.vue'
import type { WikiNode } from '~/src/core/domain/wiki-node'

vi.mock('@vueuse/core', () => ({ useDebounceFn: (fn: Function) => fn, onClickOutside: () => {} }))
vi.mock('~/composables/useWikiService', () => ({ useWikiService: () => ({ searchNodes: vi.fn().mockResolvedValue([]), getInboundReferences: vi.fn().mockResolvedValue([]), findInboundReferences: vi.fn().mockResolvedValue([]) }) }))
vi.mock('~/composables/useCommandPalette', () => ({ useCommandPalette: () => ({ open: vi.fn() }) }))
vi.mock('#imports', () => ({ useSupabaseClient: () => ({}) }))
vi.mock('~/composables/useAssetUpload', () => ({ useAssetUpload: () => ({ uploadAsset: vi.fn(), uploading: { value: false }, error: { value: null } }) }))
vi.mock('~/src/presentation/components/editor/EditorBubble.vue', () => ({ default: { name: 'EditorBubble', props: ['editor'], template: '<div></div>' } }))
vi.mock('~/src/presentation/components/editor/EditorSlash.vue', () => ({ default: { name: 'EditorSlash', props: ['editor'], template: '<div></div>' } }))
vi.mock('~/src/presentation/tiptap/editor-setup', () => ({ getEditorExtensions: () => [] }))
vi.mock('@tiptap/starter-kit', () => ({ default: { name: 'starterKit', type: 'extension' } }))
vi.mock('@tiptap/extension-image', () => ({ default: { name: 'image', type: 'extension' } }))
vi.mock('@tiptap/core', () => ({ Extension: { create: (c: any) => ({ ...c, type: 'extension' }) }, Node: { create: (c: any) => ({ ...c, type: 'node' }) }, Mark: { create: (c: any) => ({ ...c, type: 'mark' }) } }))

const { editorBox } = vi.hoisted(() => ({ editorBox: { value: null as any } }))

vi.mock('@tiptap/vue-3', () => ({
  EditorContent: defineComponent({ name: 'EditorContent', props: { editor: Object }, setup: () => () => h('div', { 'data-testid': 'tiptap-editor', class: 'ProseMirror' }) }),
  useEditor: vi.fn(() => editorBox),
}))

function makeMockEditor() {
  return {
    storage: { markdown: { getMarkdown: vi.fn(() => '') } },
    commands: { insertContent: vi.fn(), setContent: vi.fn(), setImage: vi.fn() },
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

const mockFolders: WikiNode[] = [
  { id: '1', title: 'Locations', content: '', path: 'locations', createdAt: new Date(), updatedAt: new Date() },
]

function mountComponent(overrides: Record<string, unknown> = {}) {
  editorBox.value = makeMockEditor()
  return mount(GmWikiEditor, { props: {
    initialTitle: (overrides.initialTitle as string) ?? '',
    initialContent: (overrides.initialContent as string) ?? '',
    initialPath: (overrides.initialPath as string) ?? '',
    initialCoverImageUrl: (overrides.initialCoverImageUrl as string) ?? '',
    initialEntityType: (overrides.initialEntityType as string) ?? '',
    parentOptions: (overrides.parentOptions as WikiNode[]) ?? [],
  }})
}

describe('GmWikiEditor.vue — Core UI', () => {
  it('mounts successfully', () => expect(mountComponent().exists()).toBe(true))
  it('renders TipTap editor', () => expect(mountComponent().find('[data-testid="tiptap-editor"]').exists()).toBe(true))
  it('renders title input', () => expect(mountComponent().find('[data-testid="wiki-title"]').exists()).toBe(true))
  it('renders save button', () => expect(mountComponent().find('[data-testid="wiki-save"]').exists()).toBe(true))
  it('renders entity type', () => expect(mountComponent().find('[data-testid="wiki-entity-type"]').exists()).toBe(true))
  it('renders parent selector', () => expect(mountComponent().find('[data-testid="wiki-parent"]').exists()).toBe(true))
  it('renders raw mode toggle', () => expect(mountComponent().find('[data-testid="raw-mode-toggle"]').exists()).toBe(true))

  it('shows path preview when title set', async () => {
    const w = mountComponent({ parentOptions: mockFolders, initialTitle: 'Dark Forest' })
    const t = w.find('[data-testid="wiki-title"]')
    await t.setValue('Dark Forest')
    expect(w.find('[data-testid="wiki-path-preview"]').exists()).toBe(true)
  })

  it('shows title error on empty save', async () => {
    const w = mountComponent({ initialTitle: '' })
    await w.find('[data-testid="wiki-save"]').trigger('click')
    await w.vm.$nextTick()
    expect(w.find('[data-testid="wiki-title-error"]').exists()).toBe(true)
  })

  it('emits save with payload', async () => {
    const w = mountComponent({ initialTitle: 'Test', initialContent: '# Hello' })
    await w.find('[data-testid="wiki-save"]').trigger('click')
    await w.vm.$nextTick()
    const e = w.emitted('save')
    expect(e).toBeTruthy()
    if (e) expect(e[0][0]).toMatchObject({ title: 'Test', content: '# Hello' })
  })

  it('renders cover dropzone', () => {
    expect(mountComponent().find('[data-testid="wiki-cover-dropzone"]').exists()).toBe(true)
  })
})

describe('GmWikiEditor.vue — Raw Mode', () => {
  it('toggles to raw showing textarea', async () => {
    const w = mountComponent({ initialContent: '# Raw' })
    await w.find('[data-testid="raw-mode-toggle"]').trigger('click')
    await w.vm.$nextTick()
    expect(w.find('[data-testid="raw-markdown-textarea"]').exists()).toBe(true)
  })

  it('shows markdown in raw textarea', async () => {
    const content = '# Hello World'
    const w = mountComponent({ initialContent: content })
    await w.find('[data-testid="raw-mode-toggle"]').trigger('click')
    await w.vm.$nextTick()
    expect((w.find('[data-testid="raw-markdown-textarea"]').element as HTMLTextAreaElement).value).toBe(content)
  })
})
