// ─── GmSecret TipTap Node Extension ──────────────────────────
// Custom block node for ::gm-secret{title="..."} MDC blocks.
// Renders as a visually distinct dashed-border block in the editor.
// Integrates with tiptap-markdown for bidirectional serialization.

import { Node } from '@tiptap/core'

export interface GmSecretOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    gmSecret: {
      /**
       * Insert a ::gm-secret block at the current cursor position.
       */
      insertGmSecret: (title: string) => ReturnType
    }
  }
}

export const GmSecret = Node.create<GmSecretOptions>({
  name: 'gmSecret',

  group: 'block',

  content: 'block+',

  defining: true,

  isolating: true,

  addAttributes() {
    return {
      title: {
        default: 'GM Note',
        parseHTML: (element) =>
          element.getAttribute('data-title') || 'GM Note',
        renderHTML: (attributes) => ({
          'data-title': attributes.title,
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="gm-secret"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      {
        'data-type': 'gm-secret',
        class: 'gm-secret-block',
        ...HTMLAttributes,
        style:
          'border: 2px dashed #e94560; border-radius: 8px; padding: 12px 16px; background: rgba(233, 69, 96, 0.08);',
      },
      ['div', { style: 'color: #e94560; font-weight: bold; margin-bottom: 4px;' }, `🔒 ${HTMLAttributes['data-title'] || ''}`],
      ['div', 0],
    ]
  },

  addCommands() {
    return {
      insertGmSecret:
        (title: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { title },
            content: [
              {
                type: 'paragraph',
                content: [],
              },
            ],
          })
        },
    }
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const title = node.attrs.title || 'GM Note'
          state.write(`::gm-secret{title="${title}"}`)
          state.ensureNewLine()
          state.renderContent(node)
          state.ensureNewLine()
          state.write('::')
          state.closeBlock(node)
        },
        parse: {
          setup(md: any) {
            // Register a block-level rule for ::gm-secret
            md.block.ruler.before(
              'fence',
              'gm_secret',
              (state: any, startLine: number, endLine: number, silent: boolean) => {
                const pos = state.bMarks[startLine] + state.tShift[startLine]
                const max = state.eMarks[startLine]
                const lineText = state.src.slice(pos, max)

                // Match opening ::gm-secret{title="..."}
                const openMatch = lineText.match(
                  /^::gm-secret\{title="([^"]*)"\}/,
                )
                if (!openMatch) return false

                if (silent) return true

                const title = openMatch[1]
                let nextLine = startLine + 1
                let contentStart = nextLine

                // Find closing ::
                while (nextLine < endLine) {
                  const nPos = state.bMarks[nextLine] + state.tShift[nextLine]
                  const nMax = state.eMarks[nextLine]
                  const nText = state.src.slice(nPos, nMax)
                  if (nText.trim() === '::') {
                    break
                  }
                  nextLine++
                }

                if (nextLine >= endLine) return false

                // Open token
                const token = state.push('gm_secret_open', 'div', 1)
                token.attrs = [['data-type', 'gm-secret'], ['data-title', title]]
                token.block = true

                // Mark content lines
                state.md.block.tokenize(state, contentStart, nextLine)

                // Close token
                const closeToken = state.push('gm_secret_close', 'div', -1)
                closeToken.block = true

                state.line = nextLine + 1
                return true
              },
            )

            // Register renderer rules for the custom tokens
            md.renderer.rules.gm_secret_open = (
              tokens: any,
              idx: number,
            ) => {
              const token = tokens[idx]
              const title = token.attrs?.find((a: string[]) => a[0] === 'data-title')?.[1] || 'GM Note'
              return `<div data-type="gm-secret" data-title="${md.utils.escapeHtml(title)}" style="border:2px dashed #e94560;border-radius:8px;padding:12px 16px;background:rgba(233,69,96,0.08);"><div style="color:#e94560;font-weight:bold;margin-bottom:4px;">🔒 ${md.utils.escapeHtml(title)}</div>`
            }

            md.renderer.rules.gm_secret_close = () => '</div>'
          },
        },
      },
    }
  },
})