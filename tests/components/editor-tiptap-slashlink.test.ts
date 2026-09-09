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

function pressEditorKey(key: string, code = '') {
  const editor = editorBox.value
  if (!editor) throw new Error('Editor not mounted')
  const event = new KeyboardEvent('keydown', { key, code, bubbles: true, cancelable: true })
  editor.emit('keydown', { editor, event })
  return event
}

function isActuallyVisible(el: Element | null): boolean {
  if (!el) return false
  const style = getComputedStyle(el)
  return style.visibility !== 'hidden' && style.display !== 'none'
}

async function openSlashMenu() {
  pressEditorKey('/', 'Slash')
  await nextTick()
  const slashMenu = document.querySelector('[data-testid="slash-menu"]')
  expect(slashMenu).not.toBeNull()
  expect(isActuallyVisible(slashMenu)).toBe(true)
}

async function clickSlashItem(label: string) {
  const item = [...document.querySelectorAll('[data-testid="slash-item"]')]
    .find((el) => el.textContent?.includes(label))
  expect(item).toBeDefined()
  item!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  await nextTick()
  await nextTick()
}

describe('Sprint 1.13 Task 3: Slash Menu Discoverability (Trigger [[ search)', () => {
  beforeEach(() => {
    mockSearchNodes.mockReset()
    mockSearchNodes.mockResolvedValue([])
    editorBox.value = null
    document.body.querySelectorAll('[data-testid="slash-menu"]').forEach((el) => el.remove())
    document.body.querySelectorAll('[data-testid="wiki-link-suggestions"]').forEach((el) => el.remove())
  })

  it('T3.1: pressing "/" opens the slash menu with a discoverable "Link Page" entry', async () => {
    mountEditor()
    await waitForEditor()
    await openSlashMenu()

    const slashItems = [...document.querySelectorAll('[data-testid="slash-item"]')]
    expect(slashItems.some((el) => el.textContent?.includes('Link Page'))).toBe(true)
  })

  it('T3.2: clicking "Link Page" in the slash menu opens the suggestion autocomplete UI', async () => {
    mountEditor()
    await waitForEditor()
    await openSlashMenu()

    await clickSlashItem('Link Page')

    await vi.waitFor(
      () => {
        const popup = document.querySelector('[data-testid="wiki-link-suggestions"]')
        expect(popup).not.toBeNull()
        expect(isActuallyVisible(popup)).toBe(true)
      },
      { timeout: 3000, interval: 25 },
    )
  })

  it('T3.3: the triggerWikiLinkSearch command inserts the "[[" trigger at the cursor', async () => {
    mountEditor()
    await waitForEditor()
    const editor = editorBox.value

    editor.commands.triggerWikiLinkSearch()
    await nextTick()

    // Ground truth: the editor document holds the literal "[[" trigger.
    // (The markdown serializer escapes a dangling "[[" fragment to "\\[\\["
    // so an incomplete link is not misinterpreted on re-parse — that is the
    // wiki-link markdown rule's deliberate round-trip safety behaviour.)
    const docText = editor.state.doc.textContent
    expect(docText).toContain('[[')
  })
})