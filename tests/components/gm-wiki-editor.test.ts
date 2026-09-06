import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import GmWikiEditor from '~/src/presentation/components/GmWikiEditor.client.vue'
import type { WikiNode } from '~/src/core/domain/wiki-node'

vi.mock('md-editor-v3', () => ({
  MdEditor: defineComponent({
    name: 'MdEditor',
    props: { modelValue: String, theme: String, language: String, previewTheme: String },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () => h('div', { 'data-testid': 'md-editor' }, [
        h('textarea', {
          value: props.modelValue,
          'data-testid': 'editor-textarea',
          onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLTextAreaElement).value),
        }),
      ])
    },
  }),
}))

const mockFolders: WikiNode[] = [
  { id: '1', title: 'Locations', content: '', path: 'locations', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', title: 'Factions', content: '', path: 'factions', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', title: 'Dark Forest', content: '# Forest', path: 'locations.forest', createdAt: new Date(), updatedAt: new Date() },
]

function mountComponent(props: Record<string, unknown> = {}) {
  return mount(GmWikiEditor, { props: {
    initialTitle: props.initialTitle ?? '',
    initialContent: props.initialContent ?? '',
    initialPath: props.initialPath ?? '',
    parentOptions: props.parentOptions ?? [],
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
    expect(w.emitted('save')![0][0]).toEqual(expect.objectContaining({
      title: 'Haunted Cave', content: '# Boo!', path: 'locations.haunted_cave',
    }))
  })

  it('generates root-level path when no parent selected', async () => {
    const w = mountComponent({ parentOptions: mockFolders })
    await w.find('[data-testid="wiki-title"]').setValue('Root Node')
    await w.find('[data-testid="wiki-save"]').trigger('click')
    expect(w.emitted('save')![0][0].path).toBe('root_node')
  })

  it('pre-selects correct parent when editing (initialPath)', () => {
    const w = mountComponent({ parentOptions: mockFolders, initialPath: 'locations.forest' })
    expect((w.find('[data-testid="wiki-parent"]').element as HTMLSelectElement).value).toBe('locations')
  })

  it('binds initial title prop', () => {
    const w = mountComponent({ initialTitle: 'Prefilled' })
    expect((w.find('[data-testid="wiki-title"]').element as HTMLInputElement).value).toBe('Prefilled')
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
      expect(w.emitted('save')![0][0].coverImageUrl).toBe('https://cdn.example.com/forest.jpg')
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
      expect(w.emitted('save')![0][0].entityType).toBe('LOCATION')
    })
  })
})