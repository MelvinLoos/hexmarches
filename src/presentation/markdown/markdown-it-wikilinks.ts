import type MarkdownIt from 'markdown-it'

export function markdownItWikiLinks(md: MarkdownIt) {
  const defaultTextRenderer = md.renderer.rules.text || (() => '')

  function render(tokens: any, idx: number, options: any, env: any, self: any) {
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
        parts.push(md.utils.escapeHtml(content.slice(lastIndex, match.index)))
      }
      const linkTitle = match[1].trim()
      if (linkTitle) {
        parts.push(
          `<span class="wiki-link-preview" data-wiki-title="${md.utils.escapeHtml(linkTitle)}">${md.utils.escapeHtml(linkTitle)}</span>`
        )
      }
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < content.length) {
      parts.push(md.utils.escapeHtml(content.slice(lastIndex)))
    }
    return parts.length > 0 ? parts.join('') : defaultTextRenderer(tokens, idx, options, env, self)
  }

  md.renderer.rules.text = render
  md.renderer.rules.text_inline = render
}

export default markdownItWikiLinks
