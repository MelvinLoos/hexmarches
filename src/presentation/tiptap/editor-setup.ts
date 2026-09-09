// ─── TipTap Editor Configuration ──────────────────────────────
// Exports the extensions array and Markdown config for use with
// @tiptap/vue-3's `useEditor()` composable.
// The composable handles lifecycle (onMounted/onBeforeUnmount).

import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import Image from '@tiptap/extension-image'
import { WikiLink } from './extensions/WikiLink'
import { GmSecret } from './extensions/GmSecret'
import type { Extensions } from '@tiptap/core'

export interface EditorConfigOptions {
  extraExtensions?: Extensions
}

/**
 * Returns the standard extensions array for our TipTap editor.
 */
export function getEditorExtensions(opts?: EditorConfigOptions): Extensions {
  const core: Extensions = [
    StarterKit,
    Markdown.configure({
      html: false,
      breaks: true,
      linkify: false,
      transformPastedText: true,
      transformCopiedText: false,
    }),
    Image,
    WikiLink,
    GmSecret,
  ]

  if (opts?.extraExtensions) {
    return [...core, ...opts.extraExtensions]
  }

  return core
}