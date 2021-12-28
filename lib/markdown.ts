import { Parser, HtmlRenderer } from 'commonmark'
import React from 'react'
import _ from 'lodash'

export function markdownToHtml(markdown: string): string {
  const reader = new Parser()
  const writer = new HtmlRenderer({ safe: true })
  return writer.render(reader.parse(markdown))
}

export function RenderedMarkdown(props: React.HTMLAttributes<HTMLDivElement> & { markdown: string }) {
  return React.createElement("div", {
    ...(_.omit(props, ['markdown'])),
    dangerouslySetInnerHTML: { __html: markdownToHtml(props.markdown) }
  })
}
