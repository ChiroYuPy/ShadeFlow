import { createElement, useDeferredValue, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useReactFlow } from '@xyflow/react'
import { ChevronDown, Search } from 'lucide-react'
import { compatiblePort, listNodeDefs, NOTE_TYPE, type NodeDef } from '@/core'
import { CATEGORY_LABELS, CATEGORY_TEXT, nodeIcon } from '@/editor/nodeLook'
import { cn } from '@/lib/utils'
import { useGraphStore } from '@/store/graphStore'
import { useUIStore } from '@/store/uiStore'
import { SLIDE } from './motion'
import { Overlay, OverlayHeader } from './Overlay'
import { recentNodeTypes, rememberNodeType } from './recentNodes'

/** One line of the list. */
interface Entry {
  /** Unique in the list: a recent node is listed twice, under two keys. */
  key: string
  type: string
  label: string
  description: string
  /** Tailwind class tinting the icon. */
  tint: string
  def: NodeDef | null
}

interface Section {
  heading?: string
  /** Tailwind class tinting the heading: the category's color. */
  tint?: string
  entries: Entry[]
}

const NOTE: Entry = {
  key: NOTE_TYPE,
  type: NOTE_TYPE,
  label: 'Note',
  description: 'Free text to explain your graph. It does not affect the shader.',
  tint: 'text-muted-foreground',
  def: null,
}

const entryOf = (def: NodeDef, key = def.type): Entry => ({
  key,
  type: def.type,
  label: def.label,
  description: def.description,
  tint: CATEGORY_TEXT[def.category],
  def,
})

/** Search by name: exact, then prefix, then word start, then anywhere, then the category. */
function matchScore(entry: Entry, search: string): number {
  const name = entry.label.toLowerCase()
  const query = search.trim().toLowerCase()
  if (name === query) return 1
  if (name.startsWith(query)) return 0.9
  if (name.includes(` ${query}`)) return 0.7
  if (name.includes(query)) return 0.5
  return entry.def && CATEGORY_LABELS[entry.def.category].toLowerCase().startsWith(query) ? 0.2 : 0
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max))

/** A port as a colored dot and its name. A generic port takes whatever vector type is wired. */
function PortChip({ label, type }: { label: string; type: string }) {
  const any = type === 'gen'
  return (
    <li className="flex min-w-0 items-center gap-2">
      <span
        className={cn('size-2.5 shrink-0 rounded-full', any && 'bg-muted-foreground')}
        style={any ? undefined : { background: `var(--port-${type})` }}
      />
      <span className="truncate">{label}</span>
      <span className="ml-auto text-xs text-muted-foreground">{any ? 'any' : type}</span>
    </li>
  )
}

/** What a node does and what it takes and gives, unfolded under its line. */
function Details({ entry }: { entry: Entry }) {
  const { def } = entry
  const inputs = def?.inputs.filter((p) => p.connectable !== false) ?? []
  return (
    <div data-state="open" className={cn(SLIDE.top, 'mx-2 mb-2 flex flex-col gap-3 rounded-lg bg-background/50 p-3')}>
      <p className="text-sm text-muted-foreground">{entry.description}</p>
      {def && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <div className="text-xs font-medium text-muted-foreground">Inputs</div>
          <div className="text-xs font-medium text-muted-foreground">Outputs</div>
          <ul className="flex min-w-0 flex-col gap-1">
            {inputs.length === 0 && <li className="text-muted-foreground">None</li>}
            {inputs.map((p) => (
              <PortChip key={p.name} label={p.label} type={p.type} />
            ))}
          </ul>
          <ul className="flex min-w-0 flex-col gap-1">
            {def.outputs.map((p) => (
              <PortChip key={p.name} label={p.label} type={p.type} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

const NO_SECTIONS: Section[] = []

const close = () => useUIStore.getState().closePalette()

/** Search and the list. Mounted each time the palette opens, so it starts afresh. */
function PaletteBody() {
  const { at, anchor } = useUIStore((s) => s.palette)
  const graph = useGraphStore((s) => s.graph)
  const { screenToFlowPosition } = useReactFlow()

  const [search, setSearch] = useState('')
  const [active, setActive] = useState('')
  /** The line whose details are unfolded. */
  const [info, setInfo] = useState<string | null>(null)
  const list = useRef<HTMLDivElement>(null)

  // Dropped wire: only offer nodes that can be wired to it.
  const offered = useMemo(
    () => listNodeDefs().filter((def) => def.category !== 'output' && (!anchor || compatiblePort(graph, anchor, def.type) !== null)),
    [anchor, graph],
  )

  const found = useMemo<Section[]>(() => {
    // Searching: a single list, best match first.
    if (search.trim() !== '') {
      const candidates = [...offered.map((d) => entryOf(d)), ...(anchor ? [] : [NOTE])]
      const found = candidates
        .map((entry) => ({ entry, score: matchScore(entry, search) }))
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
      return found.length ? [{ entries: found.map((s) => s.entry) }] : []
    }
    // Browsing: what was used last, then one section per category.
    const out: Section[] = []
    const recent = recentNodeTypes()
      .map((type) => offered.find((d) => d.type === type))
      .filter((d): d is NodeDef => !!d)
    if (recent.length) out.push({ heading: 'Recent', entries: recent.map((d) => entryOf(d, `recent:${d.type}`)) })
    for (const c of new Set(offered.map((d) => d.category))) {
      out.push({ heading: CATEGORY_LABELS[c], tint: CATEGORY_TEXT[c], entries: offered.filter((d) => d.category === c).map((d) => entryOf(d)) })
    }
    if (!anchor) out.push({ heading: 'Annotation', entries: [NOTE] })
    return out
  }, [offered, search, anchor])

  // The sheet comes first and starts sliding in, the list follows a moment later.
  const sections = useDeferredValue(found, NO_SECTIONS)
  const entries = useMemo(() => sections.flatMap((s) => s.entries), [sections])
  // The highlighted line: the one last pointed at or reached with the arrows, else the first.
  const current = entries.find((e) => e.key === active) ?? entries[0]

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
    close()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (current) add(current.type)
      return
    }
    // Right unfolds the details of the highlighted line, Left folds them; in the search field,
    // only with the caret at the end, so the arrows still move it through the text.
    if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && current) {
      const unfold = e.key === 'ArrowRight'
      const field = e.target instanceof HTMLInputElement ? e.target : null
      if (unfold === (info === current.key) || (field && field.selectionStart !== field.value.length)) return
      e.preventDefault()
      setInfo(unfold ? current.key : null)
      return
    }
    const index = current ? entries.indexOf(current) : -1
    const target =
      e.key === 'ArrowDown' ? index + 1 : e.key === 'ArrowUp' ? index - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? entries.length - 1 : null
    if (target === null || entries.length === 0) return
    e.preventDefault()
    const next = entries[clamp(target, 0, entries.length - 1)]
    setActive(next.key)
    list.current?.querySelector(`[data-key="${CSS.escape(next.key)}"]`)?.scrollIntoView({ block: 'nearest' })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col" onKeyDown={onKeyDown}>
      <OverlayHeader>
        <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg bg-background/70 px-3 sm:h-8">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={anchor ? 'Search nodes that fit…' : 'Search nodes…'}
            aria-label="Search nodes"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
      </OverlayHeader>

      <div ref={list} role="listbox" aria-label="Nodes" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1">
        {found.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No node found.</p>}
        {sections.map((section, i) => (
          <div key={section.heading ?? i} role="group" aria-label={section.heading}>
            {section.heading && (
              <div className={cn('px-2 pt-2 pb-1 text-xs font-medium', section.tint ?? 'text-muted-foreground')}>{section.heading}</div>
            )}
            {section.entries.map((entry) => (
              <div key={entry.key}>
                <div className={cn('flex items-center rounded-lg', entry === current && 'pointer-fine:bg-accent')}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={entry === current}
                    data-palette-item=""
                    data-key={entry.key}
                    tabIndex={-1}
                    // Only a pointer that moves highlights: scrolling the list under a still one does not.
                    onPointerMove={(e) => e.pointerType === 'mouse' && entry !== current && setActive(entry.key)}
                    onClick={() => add(entry.type)}
                    className="flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 text-left text-sm outline-none"
                  >
                    {createElement(nodeIcon(entry.type), { className: cn('size-5 shrink-0', entry.tint) })}
                    <span className="flex min-w-0 flex-col">
                      <span className="font-medium whitespace-nowrap">{entry.label}</span>
                      {info !== entry.key && <span className="truncate text-xs text-muted-foreground">{entry.description}</span>}
                    </span>
                  </button>
                  {/* Clicking the line adds the node; this shows what it does first. */}
                  <button
                    type="button"
                    aria-label={`About ${entry.label}`}
                    aria-expanded={info === entry.key}
                    data-palette-info=""
                    tabIndex={-1}
                    onClick={() => {
                      setActive(entry.key)
                      setInfo(info === entry.key ? null : entry.key)
                    }}
                    className="flex size-12 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDown className={cn('size-5 transition-transform duration-200', info === entry.key && 'rotate-180')} />
                  </button>
                </div>
                {info === entry.key && <Details entry={entry} />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * The list of nodes to add, the same on every screen: clicking a line adds the node, its arrow
 * unfolds what it does and its ports. No live picture here: the list must stay light on a phone.
 */
export default function NodePalette() {
  const open = useUIStore((s) => s.palette.open)
  return (
    <Overlay open={open} onClose={close} title="Add a node" data-palette="" className="sm:h-[min(30rem,76%)]">
      <PaletteBody />
    </Overlay>
  )
}
