import Typography from '@tiptap/extension-typography'
import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { TrailingNode } from 'tiptap/demos/src/Experiments/TrailingNode/Vue/trailing-node'
import { Extension } from '@tiptap/core'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import React from 'react'
import TurndownService from 'turndown'

const turndownService = new TurndownService()

// TODO fix codeblock to not require a space after ```

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
  focus: () => void
  blur: () => void
  clearContent: () => void
  getMarkdown: () => string
}

// Takes content in HTML
let Tiptap = forwardRef((props: {
  className?: string
  content?: string
  autoFocus?: boolean
  onSubmit: () => void
}, ref: React.ForwardedRef<TiptapMethods>) => {
  // NB: This rerenders on every keypress, which is apparently a feature:
  // https://github.com/ueberdosis/tiptap/issues/2158#issuecomment-979325997
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] }
      }),
      Typography,
      Link,
      TrailingNode,
      SubmitShortcut.configure({ onSubmit: props.onSubmit }),
    ],
    editorProps: {
      attributes: {
        // form-control comes from Bootstrap
        class: `tiptap form-control ${props.className || ""}`
      }
    },
    content: props.content || "",
    ...(props.autoFocus ? { autofocus: 'end' } : {})
  })
  useImperativeHandle(ref, () => ({
    focus: () => {
      editor?.commands.focus()
    },
    blur: () => {
      editor?.commands.blur()
    },
    clearContent: () => {
      editor?.commands.clearContent()
    },
    getMarkdown: () => {
      let html: string
      if (editor) html = editor.getHTML()
      else throw new Error(`Could not fetch editor content`)
      return turndownService.turndown(html)
    }
  }))
  if (!editor) return null
  return (
    <EditorContent editor={editor} />
  )
})
Tiptap.displayName = 'Tiptap'

export { Tiptap }