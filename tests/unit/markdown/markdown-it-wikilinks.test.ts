import { describe, it, expect } from 'vitest'
import MarkdownIt from 'markdown-it'
import { markdownItWikiLinks } from '~/src/presentation/markdown/markdown-it-wikilinks'

describe('markdown-it-wikilinks plugin', () => {
  it('renders [[Title]] as styled span', () => {
    const md = new MarkdownIt()
    md.use(markdownItWikiLinks)

    const html = md.render('Meet [[Gandalf]] the wizard.')
    expect(html).toContain('<span class="wiki-link-preview"')
    expect(html).toContain('data-wiki-title="Gandalf"')
    expect(html).toContain('Gandalf')
  })

  it('does not modify regular text', () => {
    const md = new MarkdownIt()
    md.use(markdownItWikiLinks)

    const html = md.render('Just some plain text.')
    expect(html).toContain('Just some plain text.')
    expect(html).not.toContain('wiki-link-preview')
  })

  it('preserves trailing text after wiki-link', () => {
    const md = new MarkdownIt()
    md.use(markdownItWikiLinks)

    const html = md.render('[[Gandalf]] is a wizard.')
    expect(html).toContain('<span class="wiki-link-preview"')
    expect(html).toContain(' is a wizard.')
  })

  it('does not crash on normal markdown content (regression test)', () => {
    const md = new MarkdownIt()
    md.use(markdownItWikiLinks)

    // This should NOT throw — previously crashed with self.utils undefined
    const html = md.render('# Heading\n\n**bold** and *italic* with [a link](https://x.com)')
    expect(html).toContain('<h1>Heading</h1>')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<a href="https://x.com">a link</a>')
  })

  it('handles empty wiki-link gracefully', () => {
    const md = new MarkdownIt()
    md.use(markdownItWikiLinks)

    const html = md.render('Empty [[]] brackets.')
    expect(html).toContain('Empty')
    expect(html).toContain('brackets')
  })
})
