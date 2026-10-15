import { Ellipsis, Menu, SquareDashedMousePointer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/uiStore'
import { ActionButton, ActionMenuItems } from './ActionItems'
import { MENUS, offered, useActionEnv, useActionState, type ActionState } from './actions'
import { Presence } from './Presence'
import { useLast } from './useLast'

const BAR = 'panel absolute flex items-center gap-1 p-1'

const Divider = ({ className }: { className?: string }) => <span className={cn('mx-1 h-5 w-px bg-border', className)} />

/**
 * Top left: the project menu (files, examples, panels, help), the history, adding a node and the
 * generated code (what the graph teaches: always one click away).
 */
function ProjectBar({ state }: { state: ActionState }) {
  const env = useActionEnv()
  return (
    <div className={cn(BAR, 'top-3 left-3 sm:top-4 sm:left-4')}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Project menu" title="Project">
            <Menu />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="bottom" className="min-w-52">
          <ActionMenuItems items={MENUS.project} state={state} env={env} />
        </DropdownMenuContent>
      </DropdownMenu>
      <Divider />
      <ActionButton id="undo" state={state} env={env} />
      <ActionButton id="redo" state={state} env={env} />
      <Divider />
      <ActionButton id="add" state={state} env={env} />
      <ActionButton id="code" state={state} env={env} />
    </div>
  )
}

/**
 * Bottom center, only while something is selected: what is done most with it, and the rest under
 * "more". A touch screen has no right click: between them, the bar and its "more" offer all the
 * node menu does, each thing once.
 */
function SelectionBar({ state: current }: { state: ActionState }) {
  const show = current.selection.count > 0
  // While the bar leaves, it keeps showing the selection it was about.
  const state = useLast(current, show)
  const env = useActionEnv()
  const areaTool = useUIStore((s) => s.tool) === 'select'

  return (
    <Presence show={show} from="bottom" className={cn(BAR, 'bottom-4 left-1/2 -translate-x-1/2')} role="toolbar" aria-label="Selection">
      {/* A phone has just the room for the buttons. */}
      <span className="px-2 text-sm whitespace-nowrap text-muted-foreground tabular-nums max-sm:hidden">{state.selection.count} selected</span>
      <Divider className="max-sm:hidden" />
      {/* A finger has no Shift to draw a rectangle: this arms it for one drag. */}
      <Button
        variant="ghost"
        size="icon"
        aria-label="Select an area: drag a rectangle"
        title="Select an area: drag a rectangle"
        aria-pressed={areaTool}
        className={cn('hidden pointer-coarse:inline-flex', areaTool && 'bg-selection/15 text-selection')}
        onClick={() => useUIStore.getState().setTool(areaTool ? 'pan' : 'select')}
      >
        <SquareDashedMousePointer />
      </Button>
      <ActionButton id="frame" state={state} env={env} />
      <ActionButton id="previews" state={state} env={env} />
      <ActionButton id="fold" state={state} env={env} />
      <ActionButton id="insert" state={state} env={env} />
      <ActionButton id="duplicate" state={state} env={env} />
      <ActionButton id="delete" state={state} env={env} />
      {/* A wire alone has nothing more. */}
      {offered(MENUS.more, state).length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="More" title="More">
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top" className="w-56">
            <ActionMenuItems items={MENUS.more} state={state} env={env} />
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <Divider />
      <ActionButton id="deselect" state={state} env={env} />
    </Presence>
  )
}

export function Toolbar() {
  const state = useActionState()
  return (
    <>
      <ProjectBar state={state} />
      <SelectionBar state={state} />
    </>
  )
}
