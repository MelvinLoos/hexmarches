// ─── WikiLink TipTap Node Extension ───────────────────────────
// Custom inline node that renders [[Wiki-Links]] as styled spans.
// Integrates with tiptap-markdown for bidirectional serialization.
//
// Authoring UX: wiring @tiptap/suggestion so that typing "[[" opens a
// floating picklist at the cursor. The picklist is rendered by the pure
// Vue component `WikiLinkSuggestion.vue` via VueRenderer, queries the
// WikiService through `searchNodes()`, and inserts this wikiLink node.

import { Node } from '@tiptap/core'
import { Suggestion } from '@tiptap/suggestion'
import { VueNodeViewRenderer, VueRenderer } from '@tiptap/vue-3'
import { useWikiService } from '~/composables/useWikiService'
import type { WikiNodeSearchResult } from '~/src/core/domain/wiki-repository'
import WikiLinkNodeView from '~/src/presentation/tiptap/nodes/WikiLinkNodeView.vue'
import WikiLinkSuggestion from '~/src/presentation/tiptap/suggestions/WikiLinkSuggestion.vue'

export interface WikiLinkOptions {
  HTMLAttributes: Record<string, any>
}

/** A single suggestion line shown in the wiki-link autocomplete picklist. */
export interface WikiLinkSuggestionItem {
  id: string
  title: string
  entityType?: string
}

const WIKI_LINK_SUGGESTION_LIMIT = 8

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

  // The editor viewport (WYSIWYG) renders the node with a real Vue
  // component (WikiLinkNodeView) instead of raw "[[Title]]" text.
  // renderHTML is intentionally preserved: it remains the serialization
  // path for getHTML(), clipboard copies, and any headless/SSR render.
  addNodeView() {
    return VueNodeViewRenderer(WikiLinkNodeView)
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

  addProseMirrorPlugins() {
    return [
      Suggestion<WikiLinkSuggestionItem, WikiLinkSuggestionItem>({
        editor: this.editor,
        char: '[[',
        // Wiki titles may contain spaces ("[[The Harpers]]") — allow the
        // suggestion query to span whitespace while the trigger is typed.
        allowSpaces: true,
        minQueryLength: 0,
        decorationTag: 'span',
        decorationClass: 'wiki-link-suggestion',
        items: async ({ query }) => {
          // The plugin query is relative to the trigger char; a leading "["
          // from the second bracket is stripped before searching.
          const normalized = query.replace(/^\[+/, '').trim()
          const searchQuery = normalized || ' '
          let results: WikiNodeSearchResult[]
          try {
            results = await useWikiService().searchNodes(searchQuery, WIKI_LINK_SUGGESTION_LIMIT)
          } catch {
            results = []
          }
          return results.map((entry) => ({
            id: entry.node.id,
            title: entry.node.title,
            entityType: entry.node.entityType,
          }))
        },
        command: ({ editor, range, props }) => {
          editor.chain().focus()
            .deleteRange(range)
            .insertWikiLink(props.title)
            .run()
        },
        render: () => {
          let renderer: VueRenderer | null = null
          let unmount: (() => void) | null = null
          return {
            onStart: (props) => {
              renderer = new VueRenderer(WikiLinkSuggestion, {
                editor: props.editor,
                props,
              })
              const element = renderer.element
              if (element) {
                unmount = props.mount(element)
              }
            },
            onUpdate: (props) => {
              renderer?.updateProps(props)
            },
            onExit: () => {
              renderer?.destroy()
              renderer = null
              unmount?.()
              unmount = null
            },
          }
        },
      }),
    ]
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