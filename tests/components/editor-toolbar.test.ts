import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import GmEditorToolbar from '~/src/presentation/components/editor/GmEditorToolbar.vue'

// ── Editor mock ──────────────────────────────────────────────────
// The toolbar drives a TipTap chain: editor.chain().focus().toggleX().run().
// A Proxy makes every method return the chain itself; only `run` records.
function makeEditor() {
  const executed: string[] = []
  const chainProxy = new Proxy({} as Record<string, unknown>, {
    get(_target, prop) {
      if (prop === 'run') return () => { executed.push('run') }
      return () => chainProxy
    },
  })
  return {
    executed,
    chain: vi.fn(() => chainProxy),
    isActive: vi.fn().mockReturnValue(false),
    can: vi.fn().mockReturnValue({ undo: () => true, redo: () => false }),
  }
}

function mountToolbar(editor: ReturnType<typeof makeEditor>) {
  return mount(GmEditorToolbar, { props: { editor } })
}

describe('GmEditorToolbar.vue — Persistent Formatting Toolbar', () => {
  const buttonTestIds = [
    'toolbar-bold',
    'toolbar-italic',
    'toolbar-strike',
    'toolbar-inline-code',
    'toolbar-h1',
    'toolbar-h2',
    'toolbar-h3',
    'toolbar-bullet-list',
    'toolbar-ordered-list',
    'toolbar-blockquote',
    'toolbar-code-block',
    'toolbar-hr',
    'toolbar-undo',
    'toolbar-redo',
  ]

  it('renders the toolbar container with all formatting buttons', () => {
    const editor = makeEditor()
    const w = mountToolbar(editor)
    expect(w.find('[data-testid="editor-toolbar"]').exists()).toBe(true)
    for (const id of buttonTestIds) {
      expect(w.find(`[data-testid="${id}"]`).exists(), `missing ${id}`).toBe(true)
    }
  })

  it('does not render when editor is null', () => {
    const w = mount(GmEditorToolbar, { props: { editor: null } })
    expect(w.find('[data-testid="editor-toolbar"]').exists()).toBe(false)
  })

  it('clicking bold runs the TipTap chain (chain.focus.toggleBold.run)', async () => {
    const editor = makeEditor()
    const w = mountToolbar(editor)
    await w.find('[data-testid="toolbar-bold"]').trigger('click')
    expect(editor.executed).toContain('run')
  })

  it('clicking H2 runs the heading toggle chain', async () => {
    const editor = makeEditor()
    const w = mountToolbar(editor)
    await w.find('[data-testid="toolbar-h2"]').trigger('click')
    expect(editor.executed).toContain('run')
  })

  it('highlights buttons whose format is active', () => {
    const editor = makeEditor()
    editor.isActive.mockImplementation((name: string) => name === 'bold')
    const w = mountToolbar(editor)
    const bold = w.find('[data-testid="toolbar-bold"]')
    expect(bold.classes()).toContain('bg-gm-primary')
    expect(w.find('[data-testid="toolbar-italic"]').classes()).not.toContain('bg-gm-primary')
  })

  it('disables undo/redo based on editor.can()', () => {
    const editor = makeEditor()
    const w = mountToolbar(editor)
    // can().undo() === true  → undo enabled (no disabled attribute)
    expect(w.find('[data-testid="toolbar-undo"]').attributes('disabled')).toBeUndefined()
    // can().redo() === false → redo disabled
    expect(w.find('[data-testid="toolbar-redo"]').attributes('disabled')).toBeDefined()
  })
})