import type MarkdownIt from 'markdown-it'

/**
 * markdown-it plugin that transforms [[Title]] wiki-links into
 * styled <span class="wiki-link-preview"> elements for the
 * md-editor-v3 live preview pane.
 *
 * The actual URL resolution happens at the viewer page
 * (WikiLink.vue + remark-wikilinks plugin). This plugin only
 * provides visual parity in the editor preview.
 */
export function markdownItWikiLinks(md: MarkdownIt) {
  // Override the default text renderer to intercept [[Title]] patterns
  const defaultTextRenderer = md.renderer.rules.text_inline || md.renderer.rules.text

  md.renderer.rules.text = function (tokens, idx, options, env, self) {
    const token = tokens[idx]
    const content = token.content

    // Regex to match [[Title]] patterns
    const wikiLinkRe = /\[\[([^\]]+)\]\]/g
    const parts: string[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    wikiLinkRe.lastIndex = 0
    while ((match = wikiLinkRe.exec(content)) !== null) {
      // Push preceding text
      if (match.index > lastIndex) {
        parts.push(self.utils.escapeHtml(content.slice(lastIndex, match.index)))
      }

      const linkTitle = match[1].trim()
      if (linkTitle) {
        // Render as styled span (no real href since this is preview-only)
        parts.push(
          `<span class="wiki-link-preview" data-wiki-title="${self.utils.escapeHtml(linkTitle)}">${self.utils.escapeHtml(linkTitle)}</span>`
        )
      }

      lastIndex = match.index + match[0].length
    }

    // Push remaining text
    if (lastIndex < content.length) {
      parts.push(self.utils.escapeHtml(content.slice(lastIndex)))
    }

    // If no wiki-links found, fall back to default renderer
    if (parts.length === 0) {
      return defaultTextRenderer
        ? defaultTextRenderer(tokens, idx, options, env, self)
        : self.utils.escapeHtml(content)
    }

    return parts.join('')
  }
}

export default markdownItWikiLinks
