import { useGraphStore } from '@/store/graphStore'
import { useUIStore } from '@/store/uiStore'
import { Presence } from './Presence'

/** A new project is just the Output node: say how to start, where the selection bar would be. */
export function EmptyHint() {
  const empty = useGraphStore((s) => Object.keys(s.graph.nodes).length <= 1)
  const nothingSelected = useUIStore((s) => s.selected.size === 0)
  return (
    <Presence
      show={empty && nothingSelected}
      from="bottom"
      data-empty-hint=""
      className="absolute bottom-6 left-1/2 w-max max-w-[calc(100%-1.5rem)] -translate-x-1/2 text-center text-sm text-muted-foreground"
    >
      <span className="pointer-coarse:hidden">
        Press <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">Tab</kbd> to add a node
      </span>
      <span className="hidden pointer-coarse:inline">Tap + to add a node</span>, or start from an{' '}
      <button
        type="button"
        className="text-foreground underline underline-offset-4 hover:text-selection"
        onClick={() => useUIStore.getState().setExamplesOpen(true)}
      >
        example
      </button>
      .
    </Presence>
  )
}
