import { Parser, HtmlRenderer } from 'commonmark'
import React from 'react'
import _ from 'lodash'
import * as R from 'ramda'
import cheerio from 'cheerio'

function removeTrailingBlankLines(x: string): string {
  return R.dropLastWhile(R.isEmpty, x.split('\n')).join('\n')
}

function isExternal(href: string): boolean {
  const url = new URL(href, window.location.href)
  return url.hostname !== window.location.hostname
}

export function markdownToHtml(markdown: string): string {
  const reader = new Parser()
  const writer = new HtmlRenderer({ safe: true })
  let html = writer.render(reader.parse(markdown))

  // Remove trailing newlines in <pre><code>. Otherwise Tiptap shows a blank line at the end.
  {
    const $ = cheerio.load(html)
    $('pre code').each((i, el) => {
      const $el = $(el)
      const text = $el.text()
      $el.text(removeTrailingBlankLines(text))
    })
    html = $.html()
  }

  // Use target="_blank" for external links. Otherwise Tauri opens them in the app.
  {
    const $ = cheerio.load(html)
    $('a').each((i, el) => {
      const $el = $(el)
      const href = $el.attr('href')
      if (href && isExternal(href)) {
        $el.attr('target', '_blank')
      }
    })
    html = $.html()
  }

  return html
}

export function RenderedMarkdown(
  props: React.HTMLAttributes<HTMLDivElement> & { markdown: string }
) {
  return React.createElement('div', {
    ..._.omit(props, ['markdown']),
    dangerouslySetInnerHTML: { __html: markdownToHtml(props.markdown) },
  })
}
