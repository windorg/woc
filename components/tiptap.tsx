import Typography from '@tiptap/extension-typography'
import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link, { LinkOptions } from '@tiptap/extension-link'
import { TrailingNode } from 'tiptap/demos/src/Experiments/TrailingNode/Vue/trailing-node'
import { Extension, getAttributes, Mark } from '@tiptap/core'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import React from 'react'
import { Plugin, PluginKey } from 'prosemirror-state'
import TurndownService from 'turndown'
import { TiptapBubbleMenu } from './tiptapBubbleMenu'
import styles from './tiptap.module.scss'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import Heading from '@tiptap/extension-heading'

const turndownService = new TurndownService({
  headingStyle: 'atx', // # headers
  codeBlockStyle: 'fenced', // ``` code blocks ```
  hr: '---', // --- horizontal rules
})

const SubmitShortcut = Extension.create<{ onSubmit: () => void }>({
  name: 'SubmitShortcut',
  addOptions() {
    return {
      onSubmit: () => {
        return
      },
    }
  },
  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => {
        this.options.onSubmit()
        return true
      },
    }
  },
})

type LinkWithDialogOptions = Omit<LinkOptions, 'openOnClick'> & {
  onLinkClick: (attrs: { href: string }) => void
  onLinkCommand: () => void
}

const LinkWithDialog: Mark<LinkWithDialogOptions> = Link.extend({
  addKeyboardShortcuts() {
    return {
      'Mod-u': () => {
        this.options.onLinkCommand()
        return true
      },
    }
  },
  addOptions() {
    return {
      ...this.parent?.(),
      openOnClick: false,
    }
  },
  addProseMirrorPlugins() {
    const plugins = this.parent ? this.parent() : []
    plugins.push(
      new Plugin({
        key: new PluginKey('handleClickLink'),
        props: {
          handleClick: (view, pos, event) => {
            const attrs = getAttributes(view.state, this.type.name)
            const link = (event.target as HTMLElement)?.closest('a')
            if (link && attrs.href) {
              this.options.onLinkClick({ href: attrs.href })
              return true
            }
            return false
          },
        },
      })
    )
    return plugins
  },
})

// TODO: move this into the LinkWithDialog extension itself, somehow? It's not nice that all the state is handled by the Tiptap component.
const LinkDialog = (props: { editor: Editor; open; onHide; hrefValue: string; setHrefValue }) => {
  return (
    <TiptapBubbleMenu className={styles.linkDialog} editor={props.editor} open={props.open}>
      <input
        type="text"
        className={styles.linkHrefInput}
        value={props.hrefValue}
        onChange={(e) => props.setHrefValue(e.target.value)}
        placeholder="Paste or type a link"
        autoFocus
        onBlur={props.onHide}
        onKeyDown={(e) => {
          const href = props.hrefValue.trim()
          if (e.key === 'Enter') {
            if (props.editor.isActive('link')) {
              if (href === '') {
                props.editor.chain().focus().extendMarkRange('link').unsetLink().run()
              } else {
                props.editor
                  .chain()
                  .focus()
                  .extendMarkRange('link')
                  .updateAttributes('link', { href })
                  .run()
              }
            } else {
              props.editor.commands.setLink({ href })
            }
            props.setHrefValue('')
            props.onHide()
          }
          if (e.key === 'Escape') {
            props.setHrefValue('')
            props.onHide()
          }
        }}
      />
    </TiptapBubbleMenu>
  )
}

export type TiptapMethods = {
  focus: () => void
  blur: () => void
  clearContent: () => void
  getMarkdown: () => string
}

// Takes content in HTML
let Tiptap = forwardRef(
  (
    props: {
      className?: string
      content?: string
      autoFocus?: boolean
      onSubmit: () => void
    },
    ref: React.ForwardedRef<TiptapMethods>
  ) => {
    const [linkDialogOpen, setLinkDialogOpen] = useState(false)
    const [linkDialogHref, setLinkDialogHref] = useState('')
    // NB: This rerenders on every keypress, which is apparently a feature:
    // https://github.com/ueberdosis/tiptap/issues/2158#issuecomment-979325997
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: false,
        }),
        Heading.extend({
          // Forbid bold from appearing in headings. The full list of available marks can be fetched with:
          // rg -l 'Mark.create' tiptap/packages/ | xargs rg 'name:'
          marks: 'italic code strike link',
        }).configure({ levels: [1, 2, 3] }),
        Typography,
        LinkWithDialog.configure({
          onLinkCommand: () => setLinkDialogOpen(true),
          onLinkClick: ({ href }) => {
            setLinkDialogHref(href)
            setLinkDialogOpen(true)
          },
        }),
        TrailingNode,
        SubmitShortcut.configure({ onSubmit: props.onSubmit }),
      ],
      editorProps: {
        attributes: {
          // form-control comes from Bootstrap
          class: `tiptap form-control ${props.className || ''}`,
        },
      },
      content: props.content || '',
      ...(props.autoFocus ? { autofocus: 'end' } : {}),
    })
    // https://github.com/ueberdosis/tiptap/issues/3566#issuecomment-1517365072
    React.useEffect(() => {
      if (props.autoFocus && editor) {
        editor.commands.focus()
      }
    }, [props.autoFocus, editor])
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
      },
    }))
    if (!editor) return null
    return (
      <>
        <EditorContent editor={editor} />
        {editor && (
          <LinkDialog
            editor={editor}
            open={linkDialogOpen}
            onHide={() => {
              setLinkDialogOpen(false)
              editor.commands.focus()
            }}
            hrefValue={linkDialogHref}
            setHrefValue={setLinkDialogHref}
          />
        )}
      </>
    )
  }
)
Tiptap.displayName = 'Tiptap'

export { Tiptap }
