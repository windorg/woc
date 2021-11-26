import { Parser, HtmlRenderer } from 'commonmark'
import React from 'react'

export function renderMarkdown(text: string) {
  const reader = new Parser()
  const writer = new HtmlRenderer({ safe: true })

  const html = writer.render(reader.parse(text))
  return React.createElement("div", {
    dangerouslySetInnerHTML: { __html: html }
  })
}