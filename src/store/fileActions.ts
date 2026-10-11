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
import { useGraphStore } from './graphStore'
import { useUIStore } from './uiStore'

/**
 * Run an action that replaces the whole project. When there is something to lose
 * (more than the Output node), ask first; the replacement is undoable anyway.
 */
export function confirmReplace(what: string, run: () => void) {
  if (Object.keys(useGraphStore.getState().graph.nodes).length <= 1) return run()
  useUIStore.getState().setConfirmation({
    message: `${what} The current project will be replaced (Ctrl+Z brings it back).`,
    confirmLabel: 'Replace',
    run,
  })
}

export function newProject() {
  useGraphStore.getState().replaceGraph(newGraph())
}

export function loadGraph(graph: Graph) {
  useGraphStore.getState().replaceGraph(graph)
}

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
    useGraphStore.getState().replaceGraph(parseProject(await file.text()))
  } catch (e) {
    useUIStore.getState().setNotice(e instanceof Error ? e.message : 'Could not open this file')
  }
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

/** Text to put on the clipboard for the current selection, or `null` if nothing can be copied. */
export function copySelection(): string | null {
  const fragment = selectedFragment()
  return fragment && serializeFragment(fragment)
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
    useUIStore.getState().setNotice('The browser blocked clipboard access')
  }
}

export const copyToClipboard = () => writeClipboard(copySelection())
export const cutToClipboard = () => writeClipboard(cutSelection())

export async function pasteFromClipboard() {
  try {
    if (!pasteText(await navigator.clipboard.readText())) useUIStore.getState().setNotice('Nothing to paste')
  } catch {
    useUIStore.getState().setNotice('The browser blocked clipboard access')
  }
}
