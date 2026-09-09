// ─── TipTap Editor Factory ─────────────────────────────────────
// Creates a TipTap Editor instance directly (not via composable)
// so it can be called multiple times for raw-mode toggle reinit.

import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { BubbleMenu } from '@tiptap/extension-bubble-menu'
import { FloatingMenu } from '@tiptap/extension-floating-menu'
import Image from '@tiptap/extension-image'
import type { Extensions } from '@tiptap/core'

export interface CreateEditorOptions {
  content: string
  element: Element
  onUpdate?: (markdown: string) => void
}

/**
 * Creates a new TipTap Editor instance with standard extensions.
 * Returns the Editor directly — caller owns lifecycle (destroy).
 */
export function createEditor(options: CreateEditorOptions): Editor {
  const { content, element, onUpdate } = options

  const extensions: Extensions = [
    StarterKit,
    Markdown.configure({
      html: false,
      breaks: true,
      linkify: false,
      transformPastedText: true,
      transformCopiedText: false,
    }),
    BubbleMenu,
    FloatingMenu,
    Image,
  ]

  const editor = new Editor({
    element,
    content,
    extensions,
    onUpdate: ({ editor: ed }) => {
      if (onUpdate) {
        const markdown = ed.storage.markdown?.getMarkdown?.() ?? ''
        onUpdate(markdown)
      }
    },
  })

  return editor
}