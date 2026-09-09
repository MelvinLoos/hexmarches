import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

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

const INITIAL_MD_WITH_LINK = 'Before [[Gandalf]] after.'

function mountEditor(content = '') {
  mockSearchNodes.mockReset()
  mockSearchNodes.mockResolvedValue([])
  editorBox.value = null
  // Deep DOM mounting: attach the harness to the real document so the
  // editor view (`.ProseMirror`) and its NodeViews are queryable.
  return mount(EditorSuggestionHarness, {
    attachTo: document.body,
    props: {
      onEditor: (ed: any) => {
        editorBox.value = ed
      },
      initialContent: content,
    },
  })
}

async function waitForEditor() {
  await vi.waitFor(() => expect(editorBox.value).not.toBeNull(), { timeout: 3000, interval: 10 })
}

function waitForNodeView() {
  return vi.waitFor(
    () => {
      const nodeView = document.querySelector('[data-testid="wiki-link-node-view"]')
      expect(nodeView).not.toBeNull()
      return nodeView
    },
    { timeout: 3000, interval: 25 },
  )
}

describe('Sprint 1.13 Task 1: TipTap NodeView for WikiLink (Visual Parity)', () => {
  beforeEach(() => {
    mockSearchNodes.mockReset()
    mockSearchNodes.mockResolvedValue([])
    editorBox.value = null
    // The editor content lives inside the harness mount; clean mounted popups.
    document.body.querySelectorAll('[data-testid="wiki-link-suggestions"]').forEach((el) => el.remove())
  })

  it('T1.1: a parsed [[Gandalf]] link renders the Vue NodeView component (data-testid present)', async () => {
    mountEditor(INITIAL_MD_WITH_LINK)
    await waitForEditor()

    const nodeView = await waitForNodeView()
    expect(nodeView!.textContent).toContain('Gandalf')
  })

  it('T1.2: the NodeView renders a badge, NOT the literal [[ ]] brackets text', async () => {
    mountEditor(INITIAL_MD_WITH_LINK)
    await waitForEditor()
    await waitForNodeView()

    const proseMirror = document.querySelector('.ProseMirror')
    expect(proseMirror).not.toBeNull()
    const renderedText = proseMirror!.textContent ?? ''
    expect(renderedText).not.toContain('[[')
    expect(renderedText).not.toContain(']]')
  })

  it('T1.3: markdown serialization still emits [[Gandalf]] (SSR/clipboard parity regression guard)', async () => {
    mountEditor(INITIAL_MD_WITH_LINK)
    await waitForEditor()
    await waitForNodeView()

    const md = editorBox.value.storage.markdown.getMarkdown()
    expect(md).toContain('[[Gandalf]]')
  })
})