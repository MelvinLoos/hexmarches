import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import GmWikiEditor from '~/src/presentation/components/GmWikiEditor.client.vue'
import type { WikiNode } from '~/src/core/domain/wiki-node'

vi.mock('md-editor-v3', () => ({
  MdEditor: defineComponent({
    name: 'MdEditor',
    props: {
      modelValue: String,
      theme: String,
      language: String,
      previewTheme: String,
      markdownItConfig: Function,
      toolbars: Array,
      defToolbars: Array,
    },
    emits: ['update:modelValue'],
    setup(props, { emit, expose }) {
      const insert = vi.fn()
      const domEventHandlers = vi.fn()
      expose({ insert, focus: vi.fn(), domEventHandlers, getEditorView: vi.fn() })
      return () => h('div', { 'data-testid': 'md-editor' }, [
        // Render custom toolbar items from defToolbars
        Array.isArray(props.defToolbars) ? props.defToolbars.map((item, i) => {
          if (item && typeof item === 'object') {
            return h('div', {
              key: i,
              ...((item as any).props || {}),
              attrs: ((item as any).props || {}),
            }, (item as any).children || null)
          }
          return null
        }).filter(Boolean) : null,
        h('textarea', {
          value: props.modelValue,
          'data-testid': 'editor-textarea',
          onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLTextAreaElement).value),
        }),
      ])
    },
  }),
}))

// ── Mock useWikiService ──────────────────────────────────────────────
vi.mock('~/composables/useWikiService', () => ({
  useWikiService: () => ({
    searchNodes: vi.fn().mockResolvedValue([]),
    getInboundReferences: vi.fn().mockResolvedValue([]),
    findInboundReferences: vi.fn().mockResolvedValue([]),
  }),
}))

// ── Mock @vueuse/core ───────────────────────────────────────────────
vi.mock('@vueuse/core', () => ({
  useDebounceFn: (fn: Function, _ms: number) => fn,
  onClickOutside: () => {},
}))

const mockFolders: WikiNode[] = [
  { id: '1', title: 'Locations', content: '', path: 'locations', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', title: 'Factions', content: '', path: 'factions', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', title: 'Dark Forest', content: '# Forest', path: 'locations.forest', createdAt: new Date(), updatedAt: new Date() },
]

function mountComponent(overrides: Record<string, unknown> = {}) {
  return mount(GmWikiEditor, { props: {
    initialTitle: (overrides.initialTitle as string) ?? '',
    initialContent: (overrides.initialContent as string) ?? '',
    initialPath: (overrides.initialPath as string) ?? '',
    initialCoverImageUrl: (overrides.initialCoverImageUrl as string) ?? '',
    initialEntityType: (overrides.initialEntityType as string) ?? '',
    parentOptions: (overrides.parentOptions as WikiNode[]) ?? [],
  }})
}

describe('GmWikiEditor.vue — Parent Selector UI', () => {
  it('mounts successfully', () => expect(mountComponent().exists()).toBe(true))
  it('renders md-editor mock', () => expect(mountComponent().find('[data-testid="md-editor"]').exists()).toBe(true))
  it('renders title input', () => expect(mountComponent().find('[data-testid="wiki-title"]').exists()).toBe(true))
  it('renders save button', () => expect(mountComponent().find('[data-testid="wiki-save"]').exists()).toBe(true))

  it('NO LONGER renders raw ltree path input', () => {
    expect(mountComponent().find('[data-testid="wiki-path"]').exists()).toBe(false)
  })

  it('renders parent select dropdown', () => {
    const w = mountComponent({ parentOptions: mockFolders })
    expect(w.find('[data-testid="wiki-parent"]').exists()).toBe(true)
  })

  it('renders Root as first option', () => {
    const w = mountComponent({ parentOptions: mockFolders })
    expect(w.find('[data-testid="wiki-parent"] option:first-child').text()).toContain('Root')
  })

  it('renders folder names in select', () => {
    const w = mountComponent({ parentOptions: mockFolders })
    const t = w.find('[data-testid="wiki-parent"]').text()
    expect(t).toContain('Locations')
    expect(t).toContain('Factions')
  })

  it('shows path preview when title has content', async () => {
    const w = mountComponent({ parentOptions: mockFolders })
    // No preview before typing
    expect(w.find('[data-testid="wiki-path-preview"]').exists()).toBe(false)
    // Preview appears after typing
    await w.find('[data-testid="wiki-title"]').setValue('Dark Forest')
    await w.vm.$nextTick()
    expect(w.find('[data-testid="wiki-path-preview"]').exists()).toBe(true)
  })

  it('updates path preview when title typed', async () => {
    const w = mountComponent({ parentOptions: mockFolders })
    await w.find('[data-testid="wiki-title"]').setValue('Dark Forest')
    await w.vm.$nextTick()
    expect(w.find('[data-testid="wiki-path-preview"]').text()).toContain('dark_forest')
  })

  it('includes parent path in preview when parent selected', async () => {
    const w = mountComponent({ parentOptions: mockFolders })
    await w.find('[data-testid="wiki-parent"]').setValue('locations')
    await w.find('[data-testid="wiki-title"]').setValue('Haunted Cave')
    await w.vm.$nextTick()
    expect(w.find('[data-testid="wiki-path-preview"]').text()).toContain('locations.haunted_cave')
  })

  it('emits save payload with auto-generated path', async () => {
    const w = mountComponent({ parentOptions: mockFolders })
    await w.find('[data-testid="wiki-parent"]').setValue('locations')
    await w.find('[data-testid="wiki-title"]').setValue('Haunted Cave')
    await w.find('[data-testid="editor-textarea"]').setValue('# Boo!')
    await w.find('[data-testid="wiki-save"]').trigger('click')
    const emitPayload = ((w.emitted('save') as unknown[][])[0]?.[0]) as Record<string, unknown>
    expect(emitPayload).toEqual(expect.objectContaining({
      title: 'Haunted Cave', content: '# Boo!', path: 'locations.haunted_cave',
    }))
  })

  it('generates root-level path when no parent selected', async () => {
    const w = mountComponent({ parentOptions: mockFolders })
    await w.find('[data-testid="wiki-title"]').setValue('Root Node')
    await w.find('[data-testid="wiki-save"]').trigger('click')
    const payload = ((w.emitted('save') as unknown[][])[0]?.[0]) as Record<string, unknown>
    expect(payload.path).toBe('root_node')
  })

  it('pre-selects correct parent when editing (initialPath)', () => {
    const w = mountComponent({ parentOptions: mockFolders, initialPath: 'locations.forest' })
    expect((w.find('[data-testid="wiki-parent"]').element as HTMLSelectElement).value).toBe('locations')
  })

  it('binds initial title prop', () => {
    const w = mountComponent({ initialTitle: 'Prefilled' })
    expect((w.find('[data-testid="wiki-title"]').element as HTMLInputElement).value).toBe('Prefilled')
  })

  // ─── Title Validation ──────────────────────────────────────────
  describe('Title Validation', () => {
    it('shows error when saving with empty title', async () => {
      const w = mountComponent({ parentOptions: mockFolders })
      await w.find('[data-testid="wiki-save"]').trigger('click')
      expect(w.find('[data-testid="wiki-title-error"]').exists()).toBe(true)
      expect(w.find('[data-testid="wiki-title-error"]').text()).toContain('Title is required')
    })

    it('does not emit save when title is empty', async () => {
      const w = mountComponent({ parentOptions: mockFolders })
      await w.find('[data-testid="wiki-save"]').trigger('click')
      expect(w.emitted('save')).toBeUndefined()
    })

    it('clears error when user starts typing', async () => {
      const w = mountComponent({ parentOptions: mockFolders })
      await w.find('[data-testid="wiki-save"]').trigger('click')
      expect(w.find('[data-testid="wiki-title-error"]').exists()).toBe(true)
      await w.find('[data-testid="wiki-title"]').setValue('X')
      expect(w.find('[data-testid="wiki-title-error"]').exists()).toBe(false)
    })
  })

  // ─── Default Entity Type ───────────────────────────────────────
  describe('Default Entity Type', () => {
    it('defaults entity type to GENERAL on new forms', () => {
      const w = mountComponent({ parentOptions: mockFolders })
      expect((w.find('[data-testid="wiki-entity-type"]').element as HTMLSelectElement).value).toBe('GENERAL')
    })

    it('uses provided initial entity type when editing', () => {
      const w = mountComponent({ parentOptions: mockFolders, initialEntityType: 'NPC' })
      expect((w.find('[data-testid="wiki-entity-type"]').element as HTMLSelectElement).value).toBe('NPC')
    })
  })

  // ─── Cover Image File Upload ────────────────────────────────────
  describe('Cover Image File Upload', () => {
    it('renders a file input for cover image selection', () => {
      const w = mountComponent({ parentOptions: mockFolders })
      expect(w.find('[data-testid="wiki-cover-file"]').exists()).toBe(true)
    })

    it('emits uploadImage event when a cover file is selected', async () => {
      const w = mountComponent({ parentOptions: mockFolders })
      const file = new File(['image-data'], 'cover.png', { type: 'image/png' })
      const input = w.find('[data-testid="wiki-cover-file"]')
      // Simulate file selection
      Object.defineProperty(input.element, 'files', {
        value: [file],
        writable: false,
      })
      await input.trigger('change')
      expect(w.emitted('uploadImage')).toBeTruthy()
      expect(w.emitted('uploadImage')![0][0]).toBe(file)
    })

    it('shows uploading indicator while upload is in progress', () => {
      const w = mountComponent({ parentOptions: mockFolders })
      // Uploading is false initially
      expect(w.find('[data-testid="wiki-cover-uploading"]').exists()).toBe(false)
    })
  })
// ─── Issue #28: Task 3 — Cover Image & Entity Type ────────────────
  describe('Cover Image Dropzone', () => {
    it('renders a cover image URL input', () => {
      const w = mountComponent({ parentOptions: mockFolders })
      expect(w.find('[data-testid="wiki-cover-image"]').exists()).toBe(true)
    })

    it('renders a file upload dropzone', () => {
      const w = mountComponent({ parentOptions: mockFolders })
      expect(w.find('[data-testid="wiki-cover-dropzone"]').exists()).toBe(true)
    })

    it('emits coverImageUrl in save payload', async () => {
      const w = mountComponent({ parentOptions: mockFolders })
      await w.find('[data-testid="wiki-title"]').setValue('Dark Forest')
      await w.find('[data-testid="wiki-cover-image"]').setValue('https://cdn.example.com/forest.jpg')
      await w.find('[data-testid="wiki-save"]').trigger('click')
      const savePayload = ((w.emitted('save') as unknown[][])[0]?.[0]) as Record<string, unknown>
      expect(savePayload.coverImageUrl).toBe('https://cdn.example.com/forest.jpg')
    })
  })

  describe('Entity Type Dropdown', () => {
    it('renders an entity type select dropdown', () => {
      const w = mountComponent({ parentOptions: mockFolders })
      expect(w.find('[data-testid="wiki-entity-type"]').exists()).toBe(true)
    })

    it('renders all six WikiNodeType options', () => {
      const w = mountComponent({ parentOptions: mockFolders })
      const select = w.find('[data-testid="wiki-entity-type"]')
      const options = select.findAll('option')
      const optionTexts = options.map(o => o.text())
      expect(optionTexts).toContain('GENERAL')
      expect(optionTexts).toContain('LOCATION')
      expect(optionTexts).toContain('NPC')
      expect(optionTexts).toContain('FACTION')
      expect(optionTexts).toContain('ITEM')
      expect(optionTexts).toContain('QUEST')
    })

    it('emits entityType in save payload', async () => {
      const w = mountComponent({ parentOptions: mockFolders })
      await w.find('[data-testid="wiki-title"]').setValue('Dark Forest')
      await w.find('[data-testid="wiki-entity-type"]').setValue('LOCATION')
      await w.find('[data-testid="wiki-save"]').trigger('click')
      const payload3 = ((w.emitted('save') as unknown[][])[0]?.[0]) as Record<string, unknown>
      expect(payload3.entityType).toBe('LOCATION')
    })
  })

  // ── Issue #41: Wiki-Link Autocomplete ───────────────────────────
  describe('Wiki-Link Autocomplete', () => {
    it('shows picklist when [[ is typed in editor', async () => {
      const w = mountComponent({ parentOptions: mockFolders })
      const textarea = w.find('[data-testid="editor-textarea"]')
      await textarea.setValue('The party went to [[')
      await w.vm.$nextTick()
      await w.vm.$nextTick()
      expect(w.find('[data-testid="wiki-autocomplete-picklist"]').exists()).toBe(true)
    })

    it('does not show picklist for normal text', async () => {
      const w = mountComponent({ parentOptions: mockFolders })
      const textarea = w.find('[data-testid="editor-textarea"]')
      await textarea.setValue('The party went to the forest')
      await w.vm.$nextTick()
      await w.vm.$nextTick()
      expect(w.find('[data-testid="wiki-autocomplete-picklist"]').exists()).toBe(false)
    })

    it('hides picklist when Escape is pressed', async () => {
      const w = mountComponent({ parentOptions: mockFolders })
      const textarea = w.find('[data-testid="editor-textarea"]')
      await textarea.setValue('The party went to [[')
      await w.vm.$nextTick()
      await w.vm.$nextTick()
      expect(w.find('[data-testid="wiki-autocomplete-picklist"]').exists()).toBe(true)

      // Trigger Escape on the editor wrapper that has @keydown handler
      const editorWrapper = w.find('.editor-wrapper')
      await editorWrapper.trigger('keydown', { key: 'Escape' })
      await w.vm.$nextTick()
      expect(w.find('[data-testid="wiki-autocomplete-picklist"]').exists()).toBe(false)
    })

    it('shows picklist when initialContent contains [[', async () => {
      const w = mountComponent({ parentOptions: mockFolders, initialContent: 'The party went to [[' })
      await w.vm.$nextTick()
      await w.vm.$nextTick()
      expect(w.find('[data-testid="wiki-autocomplete-picklist"]').exists()).toBe(true)
    })

    it('shows picklist when Insert Wiki Link button is clicked', async () => {
      const w = mountComponent({ parentOptions: mockFolders, initialContent: 'Some content' })
      // Button should exist
      const btn = w.find('[data-testid="wiki-insert-link-btn"]')
      expect(btn.exists()).toBe(true)
      // Click the button
      await btn.trigger('click')
      await w.vm.$nextTick()
      await w.vm.$nextTick()
      expect(w.find('[data-testid="wiki-autocomplete-picklist"]').exists()).toBe(true)
    })

    it('shows search input inside picklist when in insert mode', async () => {
      const w = mountComponent({ parentOptions: mockFolders, initialContent: 'Some content' })
      const btn = w.find('[data-testid="wiki-insert-link-btn"]')
      await btn.trigger('click')
      await w.vm.$nextTick()
      await w.vm.$nextTick()
      // In insert mode, the picklist should contain a search input
      expect(w.find('[data-testid="autocomplete-search-input"]').exists()).toBe(true)
    })

    // ── Issue #47: Fixed centered modal for search picklist ─────────
    it('renders picklist as fixed centered modal with backdrop', async () => {
      const w = mountComponent({ parentOptions: mockFolders, initialContent: 'The party went to [[' })
      await w.vm.$nextTick()
      await w.vm.$nextTick()
      const picklist = w.find('[data-testid="wiki-autocomplete-picklist"]')
      expect(picklist.exists()).toBe(true)

      // The picklist should be in a fixed overlay, not absolutely positioned at bottom
      // Check for the overlay wrapper
      const overlay = w.find('[data-testid="autocomplete-overlay"]')
      expect(overlay.exists()).toBe(true)

      // Backdrop should exist for closing
      const backdrop = w.find('[data-testid="autocomplete-backdrop"]')
      expect(backdrop.exists()).toBe(true)
    })

    it('closes picklist when Insert Wiki Link button is clicked again', async () => {
      const w = mountComponent({ parentOptions: mockFolders, initialContent: 'Some content' })
      const btn = w.find('[data-testid="wiki-insert-link-btn"]')
      // Open
      await btn.trigger('click')
      await w.vm.$nextTick()
      await w.vm.$nextTick()
      expect(w.find('[data-testid="wiki-autocomplete-picklist"]').exists()).toBe(true)
      // Close
      await btn.trigger('click')
      await w.vm.$nextTick()
      expect(w.find('[data-testid="wiki-autocomplete-picklist"]').exists()).toBe(false)
    })
  })
})