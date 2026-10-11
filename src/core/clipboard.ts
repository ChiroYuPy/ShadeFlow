import type { Graph, GraphEdge, GraphNode } from './graph'
import { newId as createId } from './id'
import { sanitizeEdges, sanitizeNodes } from './project'

/**
 * A piece of a graph, for copy / paste / duplicate: some nodes and the wires
 * that run between them. Wires to nodes outside the piece are left out.
 */
export interface GraphFragment {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

const FORMAT = 'shadeflow-fragment'

/** The Output node exists once: it can be neither copied nor pasted. */
const isCopyable = (n: GraphNode) => n.type !== 'output'

export function extractFragment(graph: Graph, ids: Iterable<string>): GraphFragment | null {
  const nodes = [...new Set(ids)].map((id) => graph.nodes[id]).filter((n): n is GraphNode => !!n && isCopyable(n))
  if (nodes.length === 0) return null
  const included = new Set(nodes.map((n) => n.id))
  const edges = graph.edges.filter((e) => included.has(e.from.nodeId) && included.has(e.to.nodeId))
  return { nodes, edges }
}

export function serializeFragment(fragment: GraphFragment): string {
  return JSON.stringify({
    format: FORMAT,
    version: 1,
    nodes: Object.fromEntries(fragment.nodes.map((n) => [n.id, n])),
    edges: fragment.edges,
  })
}

/** Parse clipboard text; `null` when it is not a (usable) ShadeFlow fragment. */
export function parseFragment(text: string): GraphFragment | null {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }
  if (typeof data !== 'object' || data === null) return null
  const raw = data as Record<string, unknown>
  if (raw.format !== FORMAT) return null
  const nodes = Object.values(sanitizeNodes(raw.nodes)).filter(isCopyable)
  if (nodes.length === 0) return null
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))
  return { nodes, edges: sanitizeEdges(raw.edges, byId) }
}

/**
 * Fresh copies of a fragment: new ids everywhere, moved by `offset`.
 * `newId` is injectable so tests are deterministic.
 */
export function instantiateFragment(
  fragment: GraphFragment,
  offset: { x: number; y: number },
  newId: () => string = createId,
): GraphFragment {
  const ids = new Map(fragment.nodes.map((n) => [n.id, newId()]))
  return {
    nodes: fragment.nodes.map((n) => ({
      ...n,
      id: ids.get(n.id)!,
      position: { x: n.position.x + offset.x, y: n.position.y + offset.y },
      // values are copied so edits to the copy never leak into the original
      values: Object.fromEntries(Object.entries(n.values).map(([k, v]) => [k, [...v]])),
    })),
    edges: fragment.edges.map((e) => ({
      id: newId(),
      from: { nodeId: ids.get(e.from.nodeId)!, port: e.from.port },
      to: { nodeId: ids.get(e.to.nodeId)!, port: e.to.port },
    })),
  }
}

/**
 * Smallest diagonal shift (steps of `step`) that keeps the first pasted node from
 * landing exactly on an existing node, so repeated pastes cascade instead of stacking.
 */
export function freeOffset(graph: Graph, fragment: GraphFragment, step = 40): { x: number; y: number } {
  const taken = new Set(Object.values(graph.nodes).map((n) => `${n.position.x},${n.position.y}`))
  const first = fragment.nodes[0].position
  for (let i = 1; i < 100; i++) {
    if (!taken.has(`${first.x + step * i},${first.y + step * i}`)) return { x: step * i, y: step * i }
  }
  return { x: step, y: step }
}
