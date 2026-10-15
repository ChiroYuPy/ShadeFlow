import { newGraph, NOTE_TYPE, snapToGrid, type Graph, type GraphEdge, type GraphNode } from './graph'
import { getNodeDef } from './nodes/registry'

const FORMAT = 'shadeflow'
const VERSION = 2

/**
 * Inputs added in version 2 whose default is not what version 1 nodes computed. Projects
 * saved before get the old behavior written as explicit values, so they look the same.
 */
const V1_VALUES: Record<string, Record<string, number[]>> = {
  noise: { scale: [1] },
  'fractal-noise': { scale: [1] },
  rotate: { center: [0, 0] },
}

function migrateFromV1(nodes: Record<string, GraphNode>): Record<string, GraphNode> {
  return Object.fromEntries(
    Object.entries(nodes).map(([id, node]) => [id, { ...node, values: { ...V1_VALUES[node.type], ...node.values } }]),
  )
}

export function serializeProject(graph: Graph): string {
  return JSON.stringify({ format: FORMAT, version: VERSION, graph }, null, 2)
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isNumbers = (v: unknown): v is number[] => Array.isArray(v) && v.every((n) => typeof n === 'number' && Number.isFinite(n))

/**
 * Parse a project file. Throws an Error with a readable message when the file is
 * not a ShadeFlow project. Content is validated and cleaned (unknown nodes and
 * dangling wires dropped) so a hand-edited file cannot break the editor.
 */
export function parseProject(json: string): Graph {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    throw new Error('This file is not valid JSON')
  }
  if (!isRecord(data) || data.format !== FORMAT || !isRecord(data.graph)) {
    throw new Error('This file is not a ShadeFlow project')
  }
  if (typeof data.version !== 'number' || data.version > VERSION) {
    throw new Error('This project was made with a newer version of ShadeFlow')
  }
  const graph = sanitizeGraph(data.graph)
  return data.version < 2 ? { ...graph, nodes: migrateFromV1(graph.nodes) } : graph
}

/** Keep only well-formed nodes of known types. */
export function sanitizeNodes(raw: unknown): Record<string, GraphNode> {
  const nodes: Record<string, GraphNode> = {}
  if (!isRecord(raw)) return nodes
  for (const [key, n] of Object.entries(raw)) {
    if (!isRecord(n) || typeof n.type !== 'string') continue
    if (n.type !== NOTE_TYPE && !getNodeDef(n.type)) continue
    const pos = isRecord(n.position) ? n.position : {}
    const values: Record<string, number[]> = {}
    if (isRecord(n.values)) for (const [k, v] of Object.entries(n.values)) if (isNumbers(v)) values[k] = v
    nodes[key] = {
      id: key,
      type: n.type,
      // Projects written before the grid get their nodes put on it.
      position: snapToGrid({
        x: typeof pos.x === 'number' && Number.isFinite(pos.x) ? pos.x : 0,
        y: typeof pos.y === 'number' && Number.isFinite(pos.y) ? pos.y : 0,
      }),
      values,
      ...(typeof n.text === 'string' ? { text: n.text } : {}),
      ...(typeof n.previewPort === 'string' ? { previewPort: n.previewPort } : {}),
      ...(n.showPreview === true ? { showPreview: true } : {}),
      ...(n.collapsed === true ? { collapsed: true } : {}),
    }
  }
  return nodes
}

/** Keep only well-formed wires between existing nodes. */
export function sanitizeEdges(raw: unknown, nodes: Record<string, GraphNode>): GraphEdge[] {
  const edges: GraphEdge[] = []
  if (!Array.isArray(raw)) return edges
  for (const e of raw) {
    if (!isRecord(e) || !isRecord(e.from) || !isRecord(e.to)) continue
    const { from, to } = e
    if (typeof e.id !== 'string' || typeof from.nodeId !== 'string' || typeof from.port !== 'string') continue
    if (typeof to.nodeId !== 'string' || typeof to.port !== 'string') continue
    if (!nodes[from.nodeId] || !nodes[to.nodeId]) continue
    edges.push({ id: e.id, from: { nodeId: from.nodeId, port: from.port }, to: { nodeId: to.nodeId, port: to.port } })
  }
  return edges
}

function sanitizeGraph(raw: Record<string, unknown>): Graph {
  const nodes = sanitizeNodes(raw.nodes)
  const edges = sanitizeEdges(raw.edges, nodes)

  // The editor always needs exactly one Output node.
  if (!Object.values(nodes).some((n) => n.type === 'output')) {
    const out = newGraph().nodes.output
    nodes[out.id] = out
  }
  return { nodes, edges }
}
