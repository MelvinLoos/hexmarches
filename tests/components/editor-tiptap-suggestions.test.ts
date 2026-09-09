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

// ── Fixtures ─────────────────────────────────────────────────────
const MOCK_SEARCH_RESULTS = [
  { node: { id: 'n1', title: 'The Harpers', entityType: 'FACTION' }, rank: 1, headline: 'The Harpers are a faction' },
  { node: { id: 'n2', title: 'Harpers Guild', entityType: 'LOCATION' }, rank: 2, headline: 'The Harpers Guild hall' },
]

function mountEditor() {
  mockSearchNodes.mockReset()
  mockSearchNodes.mockResolvedValue(MOCK_SEARCH_RESULTS)
  editorBox.value = null
  return mount(EditorSuggestionHarness, {
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

function isActuallyVisible(el: Element | null): boolean {
  if (!el) return false
  const style = getComputedStyle(el)
  return style.visibility !== 'hidden' && style.display !== 'none'
}

/**
 * Simulates the author typing the wiki-link opener by driving the real
 * TipTap editor (commands → transaction → suggestion plugin state → popup).
 */
async function typeWikiLinkOpen(text = '[[') {
  const editor = editorBox.value
  if (!editor) throw new Error('Editor not mounted')
  editor.chain().focus().insertContent(text).run()
  await nextTick()
}

function pressEditorKey(key: string, code = '') {
  const editor = editorBox.value
  if (!editor) throw new Error('Editor not mounted')
  const event = new KeyboardEvent('keydown', { key, code, bubbles: true, cancelable: true })
  editor.emit('keydown', { editor, event })
  return event
}

describe('Sprint 1.12 Task 4: Wiki-Link Autocomplete (@tiptap/suggestion)', () => {
  beforeEach(() => {
    mockSearchNodes.mockReset()
    mockSearchNodes.mockResolvedValue(MOCK_SEARCH_RESULTS)
    // The suggestion plugin mounts its popup into document.body.
    document.body.querySelectorAll('[data-testid="wiki-link-suggestions"]').forEach((el) => el.remove())
  })

  it('S.1: typing "[[" mounts the suggestion popup (data-testid="wiki-link-suggestions")', async () => {
    mountEditor()
    await waitForEditor()
    await typeWikiLinkOpen('[[')

    await vi.waitFor(
      () => {
        const popup = document.querySelector('[data-testid="wiki-link-suggestions"]')
        expect(popup).not.toBeNull()
      },
      { timeout: 3000, interval: 25 },
    )
  })

  it('S.2: the suggestion popup becomes visibly rendered at the cursor', async () => {
    mountEditor()
    await waitForEditor()
    await typeWikiLinkOpen('[[')

    await vi.waitFor(
      () => {
        expect(isActuallyVisible(document.querySelector('[data-testid="wiki-link-suggestions"]'))).toBe(true)
      },
      { timeout: 3000, interval: 25 },
    )
  })

  it('S.3: opening the popup queries WikiService.searchNodes with the typed query', async () => {
    mountEditor()
    await waitForEditor()
    await typeWikiLinkOpen('[[Har')

    await vi.waitFor(() => expect(mockSearchNodes).toHaveBeenCalled(), { timeout: 3000, interval: 25 })
    // query is normalized: the "[[" trigger is stripped from the query
    const [query, limit] = mockSearchNodes.mock.calls[0]
    expect(query).toBe('Har')
    expect(limit).toBe(8)
  })

  it('S.4: selecting a suggestion inserts a wikiLink node', async () => {
    mountEditor()
    await waitForEditor()
    await typeWikiLinkOpen('[[Har')

    await vi.waitFor(
      () => {
        expect(document.querySelectorAll('[data-testid="wiki-link-suggestion-item"]').length).toBeGreaterThan(0)
      },
      { timeout: 3000, interval: 25 },
    )

    const item = document.querySelector('[data-testid="wiki-link-suggestion-item"]')
    item!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await nextTick()
    await nextTick()

    const editor = editorBox.value
    const md = editor.storage.markdown.getMarkdown()
    expect(md).toContain('[[The Harpers]]')

    const json = editor.getJSON()
    expect(JSON.stringify(json)).toContain('"wikiLink"')
    expect(JSON.stringify(json)).toContain('The Harpers')
  })
})

describe('Sprint 1.12 Task 5: GM Secret Slash Command', () => {
  beforeEach(() => {
    mockSearchNodes.mockReset()
    mockSearchNodes.mockResolvedValue([])
    document.body.querySelectorAll('[data-testid="slash-menu"]').forEach((el) => el.remove())
  })

  it('S.5: pressing "/" opens the slash menu with a GM Secret entry', async () => {
    mountEditor()
    await waitForEditor()

    pressEditorKey('/', 'Slash')
    await nextTick()

    const slashMenu = document.querySelector('[data-testid="slash-menu"]')
    expect(slashMenu).not.toBeNull()
    expect(isActuallyVisible(slashMenu)).toBe(true)

    const slashItems = [...document.querySelectorAll('[data-testid="slash-item"]')]
    expect(slashItems.some((el) => el.textContent?.includes('GM Secret'))).toBe(true)
  })

  it('S.6: selecting "GM Secret" inserts a GmSecret block that serializes to ::gm-secret', async () => {
    mountEditor()
    await waitForEditor()

    pressEditorKey('/', 'Slash')
    await nextTick()

    const gmItem = [...document.querySelectorAll('[data-testid="slash-item"]')]
      .find((el) => el.textContent?.includes('GM Secret'))
    expect(gmItem).toBeDefined()

    gmItem!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await nextTick()
    await nextTick()

    const editor = editorBox.value
    const md = editor.storage.markdown.getMarkdown()
    expect(md).toContain('::gm-secret')
    expect(md).toContain('GM Note')

    const json = editor.getJSON()
    expect(JSON.stringify(json)).toContain('"gmSecret"')
  })
})