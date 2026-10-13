import type { ReactNode } from 'react'
import { BoxSelect, ClipboardPaste, Copy, CopyPlus, Eye, EyeOff, FoldVertical, Plus, RotateCcw, Scissors, Trash2, UnfoldVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  copyToClipboard,
  cutToClipboard,
  deleteSelection,
  describeSelection,
  duplicateSelection,
  pasteFromClipboard,
  selectAll,
  toggleSelectionFold,
  toggleSelectionPreviews,
} from '@/store/fileActions'
import { useGraphStore } from '@/store/graphStore'
import { useUIStore } from '@/store/uiStore'

function Item({ icon, shortcut, children, ...props }: {
  icon: ReactNode
  shortcut?: string
  children: ReactNode
  variant?: 'destructive'
  disabled?: boolean
  onSelect: () => void
}) {
  return (
    <DropdownMenuItem {...props}>
      {icon}
      {children}
      {shortcut && <span className="ml-auto pl-4 text-xs text-muted-foreground">{shortcut}</span>}
    </DropdownMenuItem>
  )
}

/** Right-click menu of the canvas: on a node (or the selection), on a wire, or on empty space. */
export function ContextMenu() {
  const menu = useUIStore((s) => s.contextMenu)
  const selected = useUIStore((s) => s.selected)
  const graph = useGraphStore((s) => s.graph)
  if (!menu) return null

  const store = useGraphStore.getState()
  // A right-click on a node selects it first, so "the nodes" are always the selection.
  const { nodes, previewable, showPreviews, fold, removable } = describeSelection(graph, selected)
  const withValues = nodes.filter((n) => Object.keys(n.values).length > 0)

  return (
    <DropdownMenu open onOpenChange={(open) => !open && useUIStore.getState().closeContextMenu()}>
      {/* An invisible trigger at the pointer: the menu opens right there. */}
      <DropdownMenuTrigger asChild>
        <span className="fixed size-px" style={{ left: menu.x, top: menu.y }} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" onCloseAutoFocus={(e) => e.preventDefault()}>
        {menu.target === 'pane' && (
          <>
            <Item icon={<Plus />} onSelect={() => useUIStore.getState().openPalette(menu.at)}>
              Add a node here
            </Item>
            <Item icon={<ClipboardPaste />} shortcut="Ctrl+V" onSelect={() => void pasteFromClipboard()}>
              Paste
            </Item>
            <DropdownMenuSeparator />
            <Item icon={<BoxSelect />} shortcut="Ctrl+A" onSelect={selectAll}>
              Select all
            </Item>
          </>
        )}

        {menu.target === 'node' && (
          <>
            {previewable.length > 0 && (
              <Item
                icon={showPreviews ? <Eye /> : <EyeOff />}
                onSelect={toggleSelectionPreviews}
              >
                {showPreviews ? 'Show preview' : 'Hide preview'}
              </Item>
            )}
            {nodes.length > 0 && (
              <Item
                icon={fold ? <FoldVertical /> : <UnfoldVertical />}
                onSelect={toggleSelectionFold}
              >
                {fold ? 'Fold' : 'Unfold'}
              </Item>
            )}
            {withValues.length > 0 && (
              <Item icon={<RotateCcw />} onSelect={() => withValues.forEach((n) => store.resetValues(n.id))}>
                Reset values
              </Item>
            )}
            <DropdownMenuSeparator />
            <Item icon={<CopyPlus />} shortcut="Ctrl+D" onSelect={duplicateSelection}>
              Duplicate
            </Item>
            <Item icon={<Copy />} shortcut="Ctrl+C" onSelect={() => void copyToClipboard()}>
              Copy
            </Item>
            <Item icon={<Scissors />} shortcut="Ctrl+X" disabled={!removable} onSelect={() => void cutToClipboard()}>
              Cut
            </Item>
            <DropdownMenuSeparator />
            <Item icon={<Trash2 />} variant="destructive" shortcut="Del" disabled={!removable} onSelect={deleteSelection}>
              Delete
            </Item>
          </>
        )}

        {menu.target === 'edge' && (
          <Item icon={<Trash2 />} variant="destructive" shortcut="Del" onSelect={deleteSelection}>
            Delete wire
          </Item>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
