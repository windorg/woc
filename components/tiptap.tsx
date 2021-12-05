import Code from '@tiptap/extension-code'
import CodeBlock from '@tiptap/extension-code-block'
import Heading from '@tiptap/extension-heading'
import HardBreak from '@tiptap/extension-hard-break'
import Typography from '@tiptap/extension-typography'
import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Extension } from '@tiptap/core'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import React from 'react'
import TurndownService from 'turndown'

const turndownService = new TurndownService()

const SubmitShortcut = Extension.create<{ onSubmit: () => void }>({
  name: 'SubmitShortcut',
  addOptions() {
    return {
      onSubmit: () => { return }
    }
  },
  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => {
        this.options.onSubmit()
        return true
      }
    }
  }
})

export type TiptapMethods = {
  clearContent: () => void
  getMarkdown: () => string
}

// Takes content in HTML
let Tiptap = forwardRef((props: {
  content: string
  onSubmit: () => void
}, ref: React.ForwardedRef<TiptapMethods>) => {
  // TODO: why does it rerender on every keypress?
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] }
      }),
      Typography,
      Link,
      // TODO TrailingNode,
      SubmitShortcut.configure({ onSubmit: props.onSubmit }),
    ],
    editorProps: {
      attributes: {
        // form-control comes from Bootstrap
        class: 'tiptap form-control'
      }
    },
    content: props.content,
  })
  const editorRef: React.MutableRefObject<Editor | null> = useRef(null)
  useImperativeHandle(ref, () => ({
    clearContent: () => {
      editorRef.current?.commands.clearContent()
    },
    getMarkdown: () => {
      let html: string
      if (editorRef.current) html = editorRef.current?.getHTML()
      else throw new Error(`Could not fetch editor content`)
      return turndownService.turndown(html)
    }
  }))
  if (!editor) return null
  editorRef.current = editor
  return (
    <EditorContent editor={editor} />
  )
})
Tiptap.displayName = 'Tiptap'

export { Tiptap }