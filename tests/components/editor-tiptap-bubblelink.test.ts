import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// ── Controlled WikiService mock (hoisted so we can assert calls) ──
const { mockSearchNodes, editorBox } = vi.hoisted(() => ({
  mockSearchNodes: vi.fn(),
  editorBox: { value: null as any },
}))

vi.mock('@vueuse/core', () => ({
  useDebounceFn: (fn: Function) => fn,
  onClickOutside: () => {},
}))

vi.mock('~/composables/useWikiService', () => ({
  useWikiService: () => ({
    searchNodes: mockSearchNodes,
    getInboundReferences: vi.fn().mockResolvedValue([]),
    findInboundReferences: vi.fn().mockResolvedValue([]),
  }),
}))

vi.mock('~/composables/useCommandPalette', () => ({
  useCommandPalette: () => ({ open: vi.fn() }),
}))

vi.mock('~/composables/useAssetUpload', () => ({
  useAssetUpload: () => ({
    uploadAsset: vi.fn(),
    uploading: { value: false },
    error: { value: null },
    lastUploadedUrl: { value: null },
  }),
}))

vi.mock('#imports', () => ({ useSupabaseClient: () => ({}) }))

import EditorSuggestionHarness from './__harness/EditorSuggestionHarness.vue'
import EditorBubble from '~/src/presentation/components/editor/EditorBubble.vue'

const INITIAL_TEXT = 'Visit Harpers Guild.'

function mountEditor() {
  mockSearchNodes.mockReset()
  mockSearchNodes.mockResolvedValue([])
  editorBox.value = null
  return mount(EditorSuggestionHarness, {
    attachTo: document.body,
    props: {
      onEditor: (ed: any) => {
        editorBox.value = ed
      },
    },
  })
}

async function waitForEditor() {
  await vi.waitFor(() => expect(editorBox.value).not.toBeNull(), { timeout: 3000, interval: 10 })
}

async function waitForProseMirror() {
  await vi.waitFor(() => expect(document.querySelector('.ProseMirror')).not.toBeNull(), { timeout: 3000, interval: 10 })
}

/**
 * Selects `needle` inside the single-paragraph doc. ProseMirror inline
 * positions are 1 + text offset for a plain paragraph, so the exact
 * character boundaries are computable from `doc.textContent`.
 */
function selectTextInParagraph(editor: any, needle: string) {
  const full = editor.state.doc.textContent
  const start = full.indexOf(needle)
  if (start < 0) throw new Error(`Needle "${needle}" not found in text: "${full}"`)
  const from = 1 + start
  const to = from + needle.length
  editor.chain().focus().setTextSelection({ from, to }).run()
  return { from, to }
}

/**
 * Mounts the real editor + the real teleported bubble menu, types the
 * fixture paragraph, highlights "Harpers Guild", and returns the editor.
 * Only ProseMirror's DOM coordinate math (coordsAtPos) is stubbed: jsdom
 * cannot measure text layout (getClientRects is not implemented).
 */
async function mountSelectedBubbleFlow() {
  mountEditor()
  await waitForEditor()
  await waitForProseMirror()

  const editor = editorBox.value
  editor.commands.setContent(INITIAL_TEXT)
  await nextTick()
  // jsdom lacks ProseMirror's DOM measurement primitives; the popup
  // placement is irrelevant to these assertions, so coords are stubbed.
  editor.view.coordsAtPos = () => ({ top: 120, left: 80 })

  mount(EditorBubble, { attachTo: document.body, props: { editor } })
  await nextTick()

  selectTextInParagraph(editor, 'Harpers Guild')
  return editor
}

async function clickBubbleLink() {
  await vi.waitFor(
    () => {
      const btn = document.querySelector('[data-testid="bubble-link"]')
      expect(btn).not.toBeNull()
    },
    { timeout: 3000, interval: 25 },
  )
  document.querySelector('[data-testid="bubble-link"]')!
    .dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  await nextTick()
  await nextTick()
}

describe('Sprint 1.13 Task 2: Bubble Menu Link Command (Wrap Selection)', () => {
  beforeEach(() => {
    mockSearchNodes.mockReset()
    mockSearchNodes.mockResolvedValue([])
    editorBox.value = null
    document.body.querySelectorAll('[data-testid="bubble-menu"]').forEach((el) => el.remove())
    document.body.querySelectorAll('[data-testid="wiki-link-suggestions"]').forEach((el) => el.remove())
  })

  it('T2.1: highlighting text reveals a bubble "Link" button (data-testid="bubble-link")', async () => {
    await mountSelectedBubbleFlow()

    const bubble = document.querySelector('[data-testid="bubble-menu"]')
    expect(bubble).not.toBeNull()
    const linkBtn = document.querySelector('[data-testid="bubble-link"]')
    expect(linkBtn).not.toBeNull()
  })

  it('T2.2: clicking the bubble "Link" button converts the selection into a wikiLink node', async () => {
    const editor = await mountSelectedBubbleFlow()
    await clickBubbleLink()

    const md = editor.storage.markdown.getMarkdown()
    expect(md).toBe('Visit [[Harpers Guild]].')

    const json = editor.getJSON()
    expect(JSON.stringify(json)).toContain('"wikiLink"')
    expect(JSON.stringify(json)).toContain('Harpers Guild')
  })

  it('T2.3: setWikiLink command replaces the active selection with the node (command-level)', async () => {
    const editor = await mountSelectedBubbleFlow()

    editor.chain().focus().setWikiLink('Harpers Guild').run()
    await nextTick()
    await nextTick()

    expect(editor.storage.markdown.getMarkdown()).toBe('Visit [[Harpers Guild]].')
    const json = editor.getJSON()
    expect(JSON.stringify(json)).toContain('"wikiLink"')
    expect(JSON.stringify(json)).toContain('Harpers Guild')
  })
})