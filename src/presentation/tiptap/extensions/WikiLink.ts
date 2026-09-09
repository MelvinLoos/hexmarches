// ─── WikiLink TipTap Node Extension ───────────────────────────
// Custom inline node that renders [[Wiki-Links]] as styled spans.
// Integrates with tiptap-markdown for bidirectional serialization.

import { Node } from '@tiptap/core'

export interface WikiLinkOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    wikiLink: {
      /**
       * Insert a [[Wiki-Link]] at the current cursor position.
       */
      insertWikiLink: (title: string) => ReturnType
    }
  }
}

export const WikiLink = Node.create<WikiLinkOptions>({
  name: 'wikiLink',

  group: 'inline',

  inline: true,

  atom: true,

  selectable: true,

  draggable: false,

  addAttributes() {
    return {
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-title'),
        renderHTML: (attributes) => ({
          'data-title': attributes.title,
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="wiki-link"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      {
        'data-type': 'wiki-link',
        class: 'wiki-link-node',
        ...HTMLAttributes,
      },
      `[[${HTMLAttributes['data-title'] || ''}]]`,
    ]
  },

  addCommands() {
    return {
      insertWikiLink:
        (title: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { title },
          })
        },
    }
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const title = node.attrs.title || ''
          state.write(`[[${title}]]`)
        },
        parse: {
          setup(md: any) {
            // Register markdown-it rule for [[Wiki-Links]]
            const defaultTextRenderer =
              md.renderer.rules.text ||
              ((tokens: any, idx: number) => tokens[idx].content)

            md.renderer.rules.text = (
              tokens: any,
              idx: number,
              options: any,
              env: any,
              self: any,
            ) => {
              const content = tokens[idx].content || ''
              if (!content.includes('[[')) {
                return defaultTextRenderer(tokens, idx, options, env, self)
              }

              const wikiLinkRe = /\[\[([^\]]+)\]\]/g
              const parts: string[] = []
              let lastIndex = 0
              let match: RegExpExecArray | null

              wikiLinkRe.lastIndex = 0
              while ((match = wikiLinkRe.exec(content)) !== null) {
                if (match.index > lastIndex) {
                  parts.push(
                    md.utils.escapeHtml(content.slice(lastIndex, match.index)),
                  )
                }
                const linkTitle = match[1].trim()
                if (linkTitle) {
                  parts.push(
                    `<span data-type="wiki-link" data-title="${md.utils.escapeHtml(linkTitle)}">[[${md.utils.escapeHtml(linkTitle)}]]</span>`,
                  )
                }
                lastIndex = match.index + match[0].length
              }
              if (lastIndex < content.length) {
                parts.push(md.utils.escapeHtml(content.slice(lastIndex)))
              }
              return parts.length > 0 ? parts.join('') : defaultTextRenderer(tokens, idx, options, env, self)
            }
          },
        },
      },
    }
  },
})