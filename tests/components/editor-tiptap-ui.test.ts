import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, defineComponent, h } from 'vue'

vi.mock('@vueuse/core', () => ({
  useDebounceFn: (fn: Function) => fn,
  onClickOutside: () => {},
}))
vi.mock('~/composables/useWikiService', () => ({
  useWikiService: () => ({ searchNodes: vi.fn().mockResolvedValue([]), getInboundReferences: vi.fn().mockResolvedValue([]), findInboundReferences: vi.fn().mockResolvedValue([]) }),
}))
vi.mock('~/composables/useCommandPalette', () => ({ useCommandPalette: () => ({ open: vi.fn() }) }))

vi.mock('@tiptap/vue-3', () => ({
  EditorContent: defineComponent({ name: 'EditorContent', props: { editor: Object }, setup() { return () => h('div', { 'data-testid': 'tiptap-editor' }) } }),
  BubbleMenu: defineComponent({ name: 'BubbleMenu', props: { editor: Object }, setup(_, { slots }) { return () => h('div', { 'data-testid': 'bubble-menu' }, slots.default?.()) } }),
  FloatingMenu: defineComponent({ name: 'FloatingMenu', props: { editor: Object }, setup(_, { slots }) { return () => h('div', { 'data-testid': 'floating-menu' }, slots.default?.()) } }),
}))

const { useEditorMock } = vi.hoisted(() => ({ useEditorMock: vi.fn() }))
vi.mock('~/src/presentation/tiptap/editor-setup', () => ({ createEditor: useEditorMock }))
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

function makeMockEditor() {
  return {
    storage: { markdown: { getMarkdown: vi.fn(() => '') } },
    commands: { insertContent: vi.fn(), setContent: vi.fn() },
    chain: () => ({ focus: () => ({ run: vi.fn() }), toggleBold: () => ({ run: vi.fn() }), toggleItalic: () => ({ run: vi.fn() }), toggleStrike: () => ({ run: vi.fn() }) }),
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

describe('Sprint 1.12 Task 3: Headless UI', () => {
  beforeEach(() => { vi.clearAllMocks(); useEditorMock.mockReset() })

  it('3.1: component mounts successfully', () => {
    expect(mountComponent().exists()).toBe(true)
  })
})
