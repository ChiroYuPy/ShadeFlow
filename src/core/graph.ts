/**
 * Serializable graph model. Plain data only — no React, no functions —
 * so it can be stored as JSON, tested and compiled anywhere.
 */

export interface GraphNode {
  id: string
  /** Id of a node definition (see `core/nodes`). */
  type: string
  position: { x: number; y: number }
  /**
   * Values of input ports (used when the port has no wire) and of
   * non-connectable parameters. Missing entries fall back to the port default.
   */
  values: Record<string, number[]>
  /** Free text, used by `note` nodes (UI-only, ignored by the compiler). */
  text?: string
  /** Output shown in the node's preview (the first one when unset). Does not affect the shader. */
  previewPort?: string
  /** Show a live preview in the node. Hidden unless set. Does not affect the shader. */
  showPreview?: boolean
  /** Folded: only the header and the plugs that are in use remain. Does not affect the shader. */
  collapsed?: boolean
}

export interface PortRef {
  nodeId: string
  port: string
}

export interface GraphEdge {
  id: string
  from: PortRef
  to: PortRef
}

export interface Graph {
  nodes: Record<string, GraphNode>
  edges: GraphEdge[]
}

/**
 * Nodes live on a grid whose cell is the height of one port row: every position is a whole
 * number of cells, and so is every size in the editor (see `editor/ShadeNode.tsx`).
 */
export const GRID = 28

/** Width of a shader node (and of a note): 8 cells. */
export const NODE_WIDTH = 8 * GRID

/** The nearest grid point. */
export const snapToGrid = (p: { x: number; y: number }) => ({
  x: Math.round(p.x / GRID) * GRID,
  y: Math.round(p.y / GRID) * GRID,
})

/** A new project: just the Output node. */
export function newGraph(): Graph {
  return {
    nodes: { output: { id: 'output', type: 'output', position: { x: 0, y: 0 }, values: {} } },
    edges: [],
  }
}

/** Node type of free-text annotations. They are not shader nodes. */
export const NOTE_TYPE = 'note'

/**
 * Do two graphs compile to the same shaders? Ignores what does not affect
 * the result (positions, note text), so callers can skip recompiling on drags.
 */
export function sameShader(a: Graph, b: Graph): boolean {
  if (a.edges !== b.edges) {
    if (a.edges.length !== b.edges.length) return false
    for (let i = 0; i < a.edges.length; i++) {
      const x = a.edges[i]
      const y = b.edges[i]
      if (x !== y && (x.from.nodeId !== y.from.nodeId || x.from.port !== y.from.port || x.to.nodeId !== y.to.nodeId || x.to.port !== y.to.port)) {
        return false
      }
    }
  }
  if (a.nodes === b.nodes) return true
  const ids = Object.keys(a.nodes)
  if (ids.length !== Object.keys(b.nodes).length) return false
  return ids.every((id) => {
    const x = a.nodes[id]
    const y = b.nodes[id]
    if (!y || x.type !== y.type) return false
    if (x.values === y.values) return true
    const keys = Object.keys(x.values)
    return (
      keys.length === Object.keys(y.values).length &&
      keys.every((k) => y.values[k] && x.values[k].length === y.values[k].length && x.values[k].every((v, i) => v === y.values[k][i]))
    )
  })
}
