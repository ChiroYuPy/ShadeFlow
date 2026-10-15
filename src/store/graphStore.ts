import { create } from 'zustand'
import { temporal } from 'zundo'
import { canConnect, newId, snapToGrid, NOTE_TYPE, parseProject, serializeProject, type Graph, type GraphFragment, type PortRef } from '@/core'
import { DEFAULT_GRAPH } from '@/demo/examples'

const STORAGE_KEY = 'shadeflow:project'

function loadSavedGraph(): Graph {
  try {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (saved) return parseProject(saved)
  } catch {
    // Corrupted or unavailable storage: fall back to the example.
  }
  return DEFAULT_GRAPH
}

interface Position {
  x: number
  y: number
}

interface GraphState {
  graph: Graph
  /** The node lands on the nearest grid point. */
  addNode: (type: string, position: Position) => string
  moveNodes: (positions: Record<string, Position>) => void
  removeNodes: (ids: string[]) => void
  removeEdges: (ids: string[]) => void
  /** Adds ready-made nodes and wires (already given fresh ids) as one undo step. */
  addFragment: (fragment: GraphFragment) => void
  /** Connects two ports, replacing any wire already on the input. No-op if invalid. */
  connect: (from: PortRef, to: PortRef) => void
  /** Moves one end of an existing wire. No-op if the new wire would be invalid. */
  reconnect: (edgeId: string, from: PortRef, to: PortRef) => void
  setValue: (nodeId: string, port: string, value: number[]) => void
  setText: (nodeId: string, text: string) => void
  /** Put every input of a node back to its default value. */
  resetValues: (nodeId: string) => void
  /** Show / hide a node's preview. */
  togglePreview: (nodeId: string) => void
  /** Fold / unfold a node. */
  toggleCollapsed: (nodeId: string) => void
  /** Choose which output a node's preview shows. */
  setPreviewPort: (nodeId: string, port: string) => void
  /** Replace the whole project (new / import). Undoable. */
  replaceGraph: (graph: Graph) => void
}

export const useGraphStore = create<GraphState>()(
  temporal(
    (set, get) => ({
      graph: loadSavedGraph(),

      addNode: (type, position) => {
        const id = newId()
        const node = { id, type, position: snapToGrid(position), values: {}, ...(type === NOTE_TYPE ? { text: '' } : {}) }
        set(({ graph }) => ({ graph: { ...graph, nodes: { ...graph.nodes, [id]: node } } }))
        return id
      },

      addFragment: ({ nodes, edges }) =>
        set(({ graph }) => ({
          graph: {
            nodes: { ...graph.nodes, ...Object.fromEntries(nodes.map((n) => [n.id, n])) },
            edges: [...graph.edges, ...edges],
          },
        })),

      moveNodes: (positions) =>
        set(({ graph }) => {
          const nodes = { ...graph.nodes }
          for (const [id, position] of Object.entries(positions)) {
            if (nodes[id]) nodes[id] = { ...nodes[id], position }
          }
          return { graph: { ...graph, nodes } }
        }),

      removeNodes: (ids) =>
        set(({ graph }) => {
          const gone = new Set(ids.filter((id) => graph.nodes[id]?.type !== 'output'))
          if (gone.size === 0) return {}
          const nodes = Object.fromEntries(Object.entries(graph.nodes).filter(([id]) => !gone.has(id)))
          const edges = graph.edges.filter((e) => !gone.has(e.from.nodeId) && !gone.has(e.to.nodeId))
          return { graph: { nodes, edges } }
        }),

      removeEdges: (ids) =>
        set(({ graph }) => {
          const gone = new Set(ids)
          return { graph: { ...graph, edges: graph.edges.filter((e) => !gone.has(e.id)) } }
        }),

      connect: (from, to) => {
        const { graph } = get()
        if (!canConnect(graph, from, to)) return
        const edges = graph.edges.filter((e) => !(e.to.nodeId === to.nodeId && e.to.port === to.port))
        edges.push({ id: newId(), from, to })
        set({ graph: { ...graph, edges } })
      },

      reconnect: (edgeId, from, to) => {
        const { graph } = get()
        const without = { ...graph, edges: graph.edges.filter((e) => e.id !== edgeId) }
        if (!canConnect(without, from, to)) return
        const edges = without.edges.filter((e) => !(e.to.nodeId === to.nodeId && e.to.port === to.port))
        edges.push({ id: edgeId, from, to })
        set({ graph: { ...graph, edges } })
      },

      setValue: (nodeId, port, value) =>
        set(({ graph }) => {
          const node = graph.nodes[nodeId]
          if (!node) return {}
          const next = { ...node, values: { ...node.values, [port]: value } }
          return { graph: { ...graph, nodes: { ...graph.nodes, [nodeId]: next } } }
        }),

      setText: (nodeId, text) =>
        set(({ graph }) => {
          const node = graph.nodes[nodeId]
          if (!node) return {}
          return { graph: { ...graph, nodes: { ...graph.nodes, [nodeId]: { ...node, text } } } }
        }),

      resetValues: (nodeId) =>
        set(({ graph }) => {
          const node = graph.nodes[nodeId]
          if (!node) return {}
          return { graph: { ...graph, nodes: { ...graph.nodes, [nodeId]: { ...node, values: {} } } } }
        }),

      togglePreview: (nodeId) =>
        set(({ graph }) => {
          const node = graph.nodes[nodeId]
          if (!node) return {}
          const next = { ...node, showPreview: !node.showPreview }
          return { graph: { ...graph, nodes: { ...graph.nodes, [nodeId]: next } } }
        }),

      toggleCollapsed: (nodeId) =>
        set(({ graph }) => {
          const node = graph.nodes[nodeId]
          if (!node) return {}
          const next = { ...node, collapsed: !node.collapsed }
          return { graph: { ...graph, nodes: { ...graph.nodes, [nodeId]: next } } }
        }),

      setPreviewPort: (nodeId, port) =>
        set(({ graph }) => {
          const node = graph.nodes[nodeId]
          if (!node || node.previewPort === port) return {}
          return { graph: { ...graph, nodes: { ...graph.nodes, [nodeId]: { ...node, previewPort: port } } } }
        }),

      replaceGraph: (graph) => set({ graph }),
    }),
    {
      // Only the graph is undoable; actions are not part of history.
      partialize: (state) => ({ graph: state.graph }),
      limit: 100,
    },
  ),
)

// ── Gestures ────────────────────────────────────────────────────────────

/**
 * Group a continuous gesture (e.g. dragging nodes) into a single undo step:
 * the state before the gesture is recorded once, then intermediate states are not.
 */
export function beginGesture() {
  endEdit()
  useGraphStore.setState((s) => ({ graph: { ...s.graph } })) // records the pre-gesture state
  useGraphStore.temporal.getState().pause()
}

export function endGesture() {
  useGraphStore.temporal.getState().resume()
}

// Typing in a field or dragging a color picker fires many changes. Consecutive
// edits of the same field form one gesture, closed after a short pause.

const EDIT_IDLE_MS = 600
let editKey: string | null = null
let editTimer: ReturnType<typeof setTimeout> | undefined

function endEdit() {
  clearTimeout(editTimer)
  if (editKey !== null) {
    editKey = null
    endGesture()
  }
}

function edit(key: string, apply: () => void) {
  if (editKey !== key) {
    beginGesture() // closes the previous edit, if any
    editKey = key
  }
  apply()
  clearTimeout(editTimer)
  editTimer = setTimeout(endEdit, EDIT_IDLE_MS)
}

export const editValue = (nodeId: string, port: string, value: number[]) =>
  edit(`${nodeId}:${port}`, () => useGraphStore.getState().setValue(nodeId, port, value))

export const editText = (nodeId: string, text: string) =>
  edit(`${nodeId}:text`, () => useGraphStore.getState().setText(nodeId, text))

// ── History ─────────────────────────────────────────────────────────────

export function undo() {
  endEdit()
  useGraphStore.temporal.getState().undo()
}

export function redo() {
  endEdit()
  useGraphStore.temporal.getState().redo()
}

// ── Autosave ────────────────────────────────────────────────────────────

if (typeof localStorage !== 'undefined') {
  let timer: ReturnType<typeof setTimeout> | undefined
  useGraphStore.subscribe((state, prev) => {
    if (state.graph === prev.graph) return
    clearTimeout(timer)
    timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, serializeProject(state.graph))
      } catch {
        // Storage full or blocked: the project simply is not autosaved.
      }
    }, 400)
  })
}
