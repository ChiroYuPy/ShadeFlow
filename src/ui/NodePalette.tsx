import { createElement, useMemo, useRef, useState } from 'react'
import { useReactFlow } from '@xyflow/react'
import { compatiblePort, concreteType, getNodeDef, listNodeDefs, NOTE_TYPE, type NodeCategory, type NodeDef } from '@/core'
import { CATEGORY_LABELS, CATEGORY_TEXT, nodeIcon } from '@/editor/nodeLook'
import { NodePreview } from '@/editor/NodePreview'
import { previewHub } from '@/render/previewHub'
import { cn } from '@/lib/utils'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useGraphStore } from '@/store/graphStore'
import { recentNodeTypes, rememberNodeType } from './recentNodes'
import { useVisualViewportVars } from './useVisualViewport'
import { useUIStore } from '@/store/uiStore'

const RECENT_PREFIX = 'recent:'

/**
 * Search by name: exact, then prefix, then word start, then anywhere, then keywords. cmdk's
 * default fuzzy match would rank "Resolution input" above "Sin" for "sin".
 */
function matchScore(value: string, search: string, keywords?: string[]): number {
  const name = value.replace(RECENT_PREFIX, '').toLowerCase()
  const query = search.trim().toLowerCase()
  if (name === query) return 1
  if (name.startsWith(query)) return 0.9
  if (name.includes(` ${query}`)) return 0.7
  if (name.includes(query)) return 0.5
  return keywords?.some((k) => k.toLowerCase().includes(query)) ? 0.2 : 0
}

const NOTE_ENTRY = { type: NOTE_TYPE, label: 'Note', description: 'Free text to explain your graph. It does not affect the shader.' }

/** A port as a colored dot and its name. */
function PortChip({ label, type }: { label: string; type: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className="size-2.5 rounded-full" style={{ background: `var(--port-${type})` }} />
      <span>{label}</span>
      <span className="ml-auto text-xs text-muted-foreground">{type}</span>
    </li>
  )
}

/** What the highlighted entry is and does, with a live preview of its result. */
function Details({ def, isNote }: { def: NodeDef | null; isNote: boolean }) {
  if (!def) {
    if (!isNote) return null
    return (
      <>
        <div className="flex items-center gap-2 font-medium">
          {createElement(nodeIcon(NOTE_TYPE), { className: 'size-5 text-muted-foreground' })}
          {NOTE_ENTRY.label}
        </div>
        <p className="text-sm text-muted-foreground">{NOTE_ENTRY.description}</p>
      </>
    )
  }
  return (
    <>
      <div className="flex items-center gap-2 font-medium">
        {createElement(nodeIcon(def.type), { className: cn('size-5', CATEGORY_TEXT[def.category]) })}
        {def.label}
      </div>
      <NodePreview nodeId={previewHub.sandboxId(def.type)} className="h-24" />
      <p className="text-sm text-muted-foreground">{def.description}</p>
      <ul className="flex flex-col gap-1 text-sm">
        {def.inputs
          .filter((p) => p.connectable !== false)
          .map((p) => (
            <PortChip key={p.name} label={p.label} type={p.type === 'gen' ? 'float' : p.type} />
          ))}
      </ul>
      <ul className="flex flex-col gap-1 border-t pt-2 text-sm">
        {def.outputs.map((p) => (
          <PortChip key={p.name} label={p.label} type={concreteType(p.type, 'float')} />
        ))}
      </ul>
    </>
  )
}

export default function NodePalette() {
  const { open, at, anchor } = useUIStore((s) => s.palette)
  const graph = useGraphStore((s) => s.graph)
  const { screenToFlowPosition } = useReactFlow()
  useVisualViewportVars()
  const [highlighted, setHighlighted] = useState('')
  const [search, setSearch] = useState('')
  const pointer = useRef<{ x: number; y: number } | null>(null)

  const groups = useMemo(() => {
    const byCategory = new Map<NodeCategory, ReturnType<typeof listNodeDefs>>()
    for (const def of listNodeDefs()) {
      if (def.category === 'output') continue // there is exactly one Output node
      // Dropped wire: only offer nodes that can be wired to it.
      if (anchor && compatiblePort(graph, anchor, def.type) === null) continue
      byCategory.set(def.category, [...(byCategory.get(def.category) ?? []), def])
    }
    return [...byCategory.entries()]
  }, [anchor, graph])

  // Browsing: one section per category. Searching: a single list, best match first
  // (cmdk sorts items inside a section, but not the sections between them).
  const sections = useMemo(() => {
    if (search.trim() === '') {
      return groups.map(([category, defs]) => ({ key: category, heading: CATEGORY_LABELS[category], defs }))
    }
    const scored = groups
      .flatMap(([, defs]) => defs)
      .map((def) => ({ def, score: matchScore(def.label, search, [def.category]) }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
    return [{ key: 'results', heading: undefined, defs: scored.map((s) => s.def) }]
  }, [groups, search])

  const add = (type: string) => {
    let position = at ?? screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    const store = useGraphStore.getState()
    const port = anchor ? compatiblePort(store.graph, anchor, type) : null
    // A node feeding an input goes to the left of where the wire was dropped.
    if (anchor?.direction === 'to') position = { x: position.x - 230, y: position.y }
    if (type !== NOTE_TYPE) rememberNodeType(type)
    const id = store.addNode(type, position)
    if (anchor && port) {
      const created = { nodeId: id, port }
      const other = { nodeId: anchor.nodeId, port: anchor.port }
      if (anchor.direction === 'from') store.connect(other, created)
      else store.connect(created, other)
    }
    useUIStore.getState().setSelection([id])
    useUIStore.getState().closePalette()
  }

  const defsByLabel = useMemo(() => new Map(listNodeDefs().map((d) => [d.label, d])), [])
  // A recent entry has the same label as its normal entry: its value is prefixed to stay unique.
  const current = defsByLabel.get(highlighted.replace(RECENT_PREFIX, '')) ?? null
  // Only nodes that are still offered (a dropped wire filters the list), and only without a search.
  const recents = useMemo(() => {
    const offered = new Set(groups.flatMap(([, defs]) => defs.map((d) => d.type)))
    return recentNodeTypes().filter((t) => offered.has(t))
  }, [groups])

  return (
    <CommandDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) useUIStore.getState().closePalette()
      }}
      title="Add a node"
      description="Search for a node to add to the graph"
      className="max-sm:top-[calc(var(--vv-top,0px)+0.5rem)] max-sm:h-[calc(var(--vv-height,100dvh)-1rem)] sm:max-w-xl"
      commandProps={{ value: highlighted, onValueChange: setHighlighted, className: 'h-full flex-row p-0 sm:h-[24rem]', filter: matchScore }}
    >
      <div className="flex min-w-0 flex-1 flex-col p-1 sm:w-56 sm:flex-none">
        <CommandInput placeholder="Search nodes…" value={search} onValueChange={setSearch} />
        <CommandList
          className="max-h-none flex-1"
          onPointerMove={(e) => {
            pointer.current = { x: e.clientX, y: e.clientY }
          }}
          // Scrolling moves the list under a still pointer: highlight what ends up there.
          onScroll={() => {
            const p = pointer.current
            if (!p) return
            const item = document.elementFromPoint(p.x, p.y)?.closest('[cmdk-item]')
            const value = item?.getAttribute('data-value')
            if (value) setHighlighted(value)
          }}
        >
          <CommandEmpty>No node found.</CommandEmpty>
          {search === '' && recents.length > 0 && (
            <CommandGroup heading="Recent">
              {recents.map((type) => {
                const def = defsByLabel.get(getNodeDef(type)?.label ?? '')
                if (!def) return null
                return (
                  <CommandItem key={type} value={RECENT_PREFIX + def.label} onSelect={() => add(type)}>
                    {createElement(nodeIcon(type), { className: CATEGORY_TEXT[def.category] })}
                    <span className="font-medium">{def.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}
          {sections.map(({ key, heading, defs }) => (
            <CommandGroup key={key} heading={heading}>
              {defs.map((def) => (
                <CommandItem key={def.type} value={def.label} keywords={[def.category]} onSelect={() => add(def.type)}>
                  {createElement(nodeIcon(def.type), { className: CATEGORY_TEXT[def.category] })}
                  <span className="font-medium whitespace-nowrap">{def.label}</span>
                  <span className="ml-2 truncate text-xs text-muted-foreground sm:hidden">{def.description}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
          {!anchor && (
            <CommandGroup heading="Annotations">
              <CommandItem value={NOTE_ENTRY.label} keywords={['comment', 'text']} onSelect={() => add(NOTE_ENTRY.type)}>
                {createElement(nodeIcon(NOTE_TYPE), { className: 'text-muted-foreground' })}
                <span className="font-medium">{NOTE_ENTRY.label}</span>
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
      </div>
      {open && (
        <aside className="hidden min-w-0 flex-1 flex-col gap-3 overflow-y-auto border-l bg-background/40 p-4 sm:flex">
          <Details def={current} isNote={highlighted === NOTE_ENTRY.label} />
        </aside>
      )}
    </CommandDialog>
  )
}
