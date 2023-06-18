// Based on https://github.com/ueberdosis/tiptap/issues/2305#issuecomment-1020665146

import Popper from '@mui/base/Popper'
import { Editor, isNodeSelection, posToDOMRect } from '@tiptap/core'

type Props = {
  editor: Editor
  open: boolean
  className?: string
}

export function TiptapBubbleMenu({
  editor,
  open,
  children,
  className,
}: React.PropsWithChildren<Props>) {
  // NB: without disablePortal it doesn't work in modals
  return (
    <Popper
      open={open}
      placement="top-start"
      className={className}
      disablePortal={true}
      modifiers={[
        {
          name: 'offset',
          options: {
            // Add a slight vertical offset for the popper from the current selection
            offset: [0, 4],
          },
        },
        {
          name: 'flip',
          enabled: true,
          options: {
            // We'll reposition (to one of the below fallback placements) whenever our Popper goes
            // outside of the editor. (This is necessary since our children aren't actually rendered
            // here, but instead with a portal, so the editor DOM node isn't a parent.)
            boundary: editor.options.element,
            fallbackPlacements: ['bottom', 'top-start', 'bottom-start', 'top-end', 'bottom-end'],
            padding: 8,
          },
        },
      ]}
      anchorEl={() => {
        // The logic here is taken from the positioning implementation in Tiptap's BubbleMenuPlugin
        // https://github.com/ueberdosis/tiptap/blob/16bec4e9d0c99feded855b261edb6e0d3f0bad21/packages/extension-bubble-menu/src/bubble-menu-plugin.ts#L183-L193
        const { ranges } = editor.state.selection
        const from = Math.min(...ranges.map((range) => range.$from.pos))
        const to = Math.max(...ranges.map((range) => range.$to.pos))

        return {
          getBoundingClientRect: () => {
            if (isNodeSelection(editor.state.selection)) {
              const node = editor.view.nodeDOM(from) as HTMLElement

              if (node) {
                return node.getBoundingClientRect()
              }
            }

            return posToDOMRect(editor.view, from, to)
          },
        }
      }}
    >
      {children}
    </Popper>
  )
}
