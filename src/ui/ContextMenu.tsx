import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUIStore } from '@/store/uiStore'
import { ActionMenuItems } from './ActionItems'
import { MENUS, useActionEnv, useActionState } from './actions'

/** Right-click menu of the canvas: on a node (or the selection), on a wire, or on empty space. */
export function ContextMenu() {
  const menu = useUIStore((s) => s.contextMenu)
  const state = useActionState()
  const env = useActionEnv()
  if (!menu) return null

  return (
    <DropdownMenu open onOpenChange={(open) => !open && useUIStore.getState().closeContextMenu()}>
      {/* An invisible trigger at the pointer: the menu opens right there. */}
      <DropdownMenuTrigger asChild>
        <span className="fixed size-px" style={{ left: menu.x, top: menu.y }} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" onCloseAutoFocus={(e) => e.preventDefault()}>
        {/* A right-click on a node selects it first, so "the nodes" are always the selection. */}
        {menu.target === 'pane' && <ActionMenuItems items={MENUS.pane} state={state} env={{ ...env, at: menu.at }} labels={{ add: 'Add a node here' }} />}
        {menu.target === 'node' && <ActionMenuItems items={MENUS.selection} state={state} env={env} />}
        {menu.target === 'edge' && <ActionMenuItems items={['delete']} state={state} env={env} labels={{ delete: 'Delete wire' }} />}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
