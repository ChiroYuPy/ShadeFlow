import {
  extractFragment,
  freeOffset,
  instantiateFragment,
  newGraph,
  parseFragment,
  parseProject,
  serializeFragment,
  serializeProject,
  type Graph,
  type GraphFragment,
} from '@/core'
import { getNodeDef, NOTE_TYPE, type GraphNode } from '@/core'
import { beginGesture, endGesture, undo, useGraphStore } from './graphStore'
import { useUIStore } from './uiStore'

/**
 * Replace the whole project, then bring it into view. Nothing is asked first: when there was
 * something to lose (more than the Output node), a notice says what happened and offers to undo it.
 */
export function loadGraph(graph: Graph, done: string) {
  const store = useGraphStore.getState()
  const worth = Object.keys(store.graph.nodes).length > 1
  store.replaceGraph(graph)
  const ui = useUIStore.getState()
  ui.requestFit()
  if (!worth) return ui.setNotice(null)
  const replaced = useGraphStore.getState().graph
  ui.setNotice(done, {
    label: 'Undo',
    // Only while nothing else has changed: later, Undo would undo something else.
    run: () => {
      if (useGraphStore.getState().graph === replaced) undo()
    },
  })
}

export const newProject = () => loadGraph(newGraph(), 'Started a new project.')

export function saveProjectFile() {
  const blob = new Blob([serializeProject(useGraphStore.getState().graph)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'shadeflow-project.json'
  a.click()
  URL.revokeObjectURL(url)
}

export async function openProjectFile(file: File) {
  try {
    loadGraph(parseProject(await file.text()), `Opened ${file.name}.`)
  } catch (e) {
    useUIStore.getState().setNotice(e instanceof Error ? e.message : 'Could not open this file')
  }
}

/** Lets the user pick a project file and opens it. */
export function chooseProjectFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json,application/json'
  input.onchange = () => {
    const file = input.files?.[0]
    if (file) void openProjectFile(file)
  }
  input.click()
}

/** Delete the selected nodes and wires (the Output node is kept). */
export function deleteSelection() {
  const ui = useUIStore.getState()
  const store = useGraphStore.getState()
  const { nodes, edges } = store.graph
  const ids = [...ui.selected]
  store.removeNodes(ids.filter((id) => id in nodes))
  store.removeEdges(ids.filter((id) => edges.some((e) => e.id === id)))
  ui.setSelection([])
}

export function selectAll() {
  const { nodes } = useGraphStore.getState().graph
  useUIStore.getState().setSelection(Object.keys(nodes))
}

// ── Copy / paste ────────────────────────────────────────────────────────

function selectedFragment() {
  return extractFragment(useGraphStore.getState().graph, useUIStore.getState().selected)
}

/**
 * What was last copied here. The system clipboard is not always reachable (the browser may
 * block it, or hold something unreadable): copy and paste inside the app work regardless.
 */
let copied: string | null = null

/** Text to put on the clipboard for the current selection, or `null` if nothing can be copied. */
export function copySelection(): string | null {
  const fragment = selectedFragment()
  if (!fragment) return null
  copied = serializeFragment(fragment)
  return copied
}

/** Copy, then delete (the Output node stays). */
export function cutSelection(): string | null {
  const text = copySelection()
  if (text !== null) deleteSelection()
  return text
}

function insert(fragment: GraphFragment) {
  const store = useGraphStore.getState()
  const copy = instantiateFragment(fragment, freeOffset(store.graph, fragment))
  store.addFragment(copy)
  useUIStore.getState().setSelection(copy.nodes.map((n) => n.id))
}

/** Paste clipboard text. Returns whether it was a ShadeFlow fragment. */
export function pasteText(text: string): boolean {
  const fragment = parseFragment(text)
  if (!fragment) return false
  insert(fragment)
  return true
}

/** Paste what was last copied in this tab. Returns whether there was something. */
export function pasteCopied(): boolean {
  return copied !== null && pasteText(copied)
}

/** Copy and paste the selection in one go, slightly offset. */
export function duplicateSelection() {
  const fragment = selectedFragment()
  if (fragment) insert(fragment)
}

// ── System clipboard (context menu) ─────────────────────────────────────

async function writeClipboard(text: string | null) {
  if (text === null) return
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Blocked (or no https): the copy still lives in this tab, see `copied`.
  }
}

export const copyToClipboard = () => writeClipboard(copySelection())
export const cutToClipboard = () => writeClipboard(cutSelection())

/** Paste from the system clipboard, falling back on what was copied in this tab. */
export async function pasteFromClipboard() {
  let text = ''
  try {
    text = await navigator.clipboard.readText()
  } catch {
    // Blocked or refused: use the copy kept in this tab.
  }
  if (!pasteText(text) && !pasteCopied()) useUIStore.getState().setNotice('Nothing to paste')
}

// ── Acting on the selected nodes ────────────────────────────────────────

/** What the selection holds, to know which actions make sense for it. */
export function describeSelection(graph: Graph, selected: ReadonlySet<string>) {
  const all = [...selected].map((id) => graph.nodes[id]).filter((n): n is GraphNode => !!n)
  const nodes = all.filter((n) => n.type !== NOTE_TYPE)
  const previewable = nodes.filter((n) => {
    const def = getNodeDef(n.type)
    return def && def.type !== 'output' && def.preview !== 'none'
  })
  const wires = graph.edges.filter((e) => selected.has(e.id))
  return {
    /** Shader nodes (no notes). */
    nodes,
    previewable,
    /** Shader nodes with a value that can be reset. */
    withValues: nodes.filter((n) => Object.keys(n.values).length > 0),
    /** The selected wires' ids. */
    wires: wires.map((e) => e.id),
    /** Everything selected that still exists. */
    count: all.length + wires.length,
    copyable: all.some((n) => n.type !== 'output'),
    /** The Output node can be neither deleted nor cut. */
    removable: wires.length > 0 || all.some((n) => n.type !== 'output'),
    // Toggles show the opposite of what the first node does, applied to all so they end up alike.
    showPreviews: !previewable[0]?.showPreview,
    fold: !nodes[0]?.collapsed,
  }
}

const currentSelection = () => describeSelection(useGraphStore.getState().graph, useUIStore.getState().selected)

/** Several nodes change at once: one undo step. */
function asOneStep(run: () => void) {
  beginGesture()
  run()
  endGesture()
}

export function toggleSelectionPreviews() {
  const { previewable, showPreviews } = currentSelection()
  if (previewable.length === 0) return
  const store = useGraphStore.getState()
  asOneStep(() => {
    for (const n of previewable) if ((n.showPreview === true) !== showPreviews) store.togglePreview(n.id)
  })
}

export function toggleSelectionFold() {
  const { nodes, fold } = currentSelection()
  if (nodes.length === 0) return
  const store = useGraphStore.getState()
  asOneStep(() => {
    for (const n of nodes) if ((n.collapsed === true) !== fold) store.toggleCollapsed(n.id)
  })
}

export function resetSelectionValues() {
  const { withValues } = currentSelection()
  const store = useGraphStore.getState()
  asOneStep(() => withValues.forEach((n) => store.resetValues(n.id)))
}
