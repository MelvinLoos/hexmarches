import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
vi.mock('#imports', () => ({ useSupabaseClient: () => ({}) }))
vi.mock('~/composables/useAssetUpload', () => ({ useAssetUpload: () => ({ uploadAsset: vi.fn(), uploading: { value: false }, error: { value: null }, lastUploadedUrl: { value: null } }) }))
import GmWikiEditor from '~/src/presentation/components/GmWikiEditor.client.vue'
import type { WikiNode } from '~/src/core/domain/wiki-node'

// ── Mock TipTap vue-3 ───────────────────────────────────────────
vi.mock('@tiptap/vue-3', () => ({
  EditorContent: defineComponent({
    name: 'EditorContent',
    props: { editor: Object },
    setup() {
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

// ── Mock editor-setup ───────────────────────────────────────────
const { useEditorMock } = vi.hoisted(() => ({ useEditorMock: vi.fn() }))
vi.mock('~/src/presentation/tiptap/editor-setup', () => ({
  createEditor: useEditorMock,
}))

// ── Mock TipTap extensions ──────────────────────────────────────
vi.mock('@tiptap/starter-kit', () => ({ default: { name: 'starterKit', type: 'extension' } }))
vi.mock('@tiptap/extension-bubble-menu', () => ({ default: { name: 'bubbleMenu', type: 'extension' } }))
vi.mock('@tiptap/extension-floating-menu', () => ({ default: { name: 'floatingMenu', type: 'extension' } }))
vi.mock('@tiptap/extension-image', () => ({ default: { name: 'image', type: 'extension' } }))
vi.mock('@tiptap/core', () => ({
  Extension: { create: (c: any) => ({ ...c, type: 'extension' }) },
  Node: { create: (c: any) => ({ ...c, type: 'node' }) },
  Mark: { create: (c: any) => ({ ...c, type: 'mark' }) },
}))

// ── Mock useWikiService ──────────────────────────────────────────
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

// ── Mock @vueuse/core ───────────────────────────────────────────
vi.mock('@vueuse/core', () => ({
  useDebounceFn: (fn: Function) => fn,
  onClickOutside: () => {},
}))

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

const mockFolders: WikiNode[] = [
  { id: '1', title: 'Locations', content: '', path: 'locations', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', title: 'Factions', content: '', path: 'factions', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', title: 'Dark Forest', content: '# Forest', path: 'locations.forest', createdAt: new Date(), updatedAt: new Date() },
]

function mountComponent(overrides: Record<string, unknown> = {}) {
  useEditorMock.mockReturnValue(makeMockEditor())
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
  it('renders entity type selector', () => expect(mountComponent().find('[data-testid="wiki-entity-type"]').exists()).toBe(true))
  it('renders parent folder selector', () => expect(mountComponent().find('[data-testid="wiki-parent"]').exists()).toBe(true))
  it('renders raw mode toggle', () => expect(mountComponent().find('[data-testid="raw-mode-toggle"]').exists()).toBe(true))

  it('shows path preview when title is set', async () => {
    const w = mountComponent({ parentOptions: mockFolders, initialTitle: 'Dark Forest' })
    // Path preview uses generatedPath computed; needs title to be filled
    const titleInput = w.find('[data-testid="wiki-title"]')
    await titleInput.setValue('Dark Forest')
    expect(w.find('[data-testid="wiki-path-preview"]').exists()).toBe(true)
  })

  it('shows title error when saving with empty title', async () => {
    const w = mountComponent({ initialTitle: '' })
    await w.find('[data-testid="wiki-save"]').trigger('click')
    await w.vm.$nextTick()
    expect(w.find('[data-testid="wiki-title-error"]').exists()).toBe(true)
  })

  it('emits save with correct payload', async () => {
    const w = mountComponent({ initialTitle: 'Test', initialContent: '# Hello' })
    const titleInput = w.find('[data-testid="wiki-title"]')
    await titleInput.setValue('Test')
    await w.find('[data-testid="wiki-save"]').trigger('click')
    await w.vm.$nextTick()
    const emitted = w.emitted('save')
    expect(emitted).toBeTruthy()
    if (emitted) {
      expect(emitted[0][0]).toMatchObject({ title: 'Test', content: '# Hello' })
    }
  })

  it('renders cover image dropzone', () => {
    expect(mountComponent().find('[data-testid="wiki-cover-dropzone"]').exists()).toBe(true)
  })
})

describe('GmWikiEditor.vue — Raw Mode', () => {
  it('toggles to raw mode showing textarea', async () => {
    const w = mountComponent({ initialContent: '# Raw test' })
    await w.find('[data-testid="raw-mode-toggle"]').trigger('click')
    await w.vm.$nextTick()
    expect(w.find('[data-testid="raw-markdown-textarea"]').exists()).toBe(true)
  })

  it('shows markdown content in raw textarea', async () => {
    const content = '# Hello World'
    const w = mountComponent({ initialContent: content })
    await w.find('[data-testid="raw-mode-toggle"]').trigger('click')
    await w.vm.$nextTick()
    const textarea = w.find('[data-testid="raw-markdown-textarea"]')
    expect((textarea.element as HTMLTextAreaElement).value).toBe(content)
  })
})
