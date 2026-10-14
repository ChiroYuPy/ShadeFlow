import type { Graph, PortRef } from './graph'
import { getNodeDef } from './nodes/registry'
import { canConvert, type PortType, type ValueType } from './types'

/** Concrete type of a port once the node's generic type is known. */
export function concreteType(type: PortType, genType: ValueType): ValueType {
  return type === 'gen' ? genType : type
}

/**
 * Resolved type of the `gen` ports of every node, from the wires connected to
 * them (the one vector type among the inputs, float when there is none).
 * Never fails: inconsistent graphs just get a best-effort answer — the
 * compiler is the one reporting errors.
 */
export function resolveGenTypes(graph: Graph): Record<string, ValueType> {
  const incoming = new Map<string, PortRef>()
  for (const e of graph.edges) incoming.set(`${e.to.nodeId}\u0000${e.to.port}`, e.from)

  const memo: Record<string, ValueType> = {}
  const visiting = new Set<string>()

  function outputType(ref: PortRef): ValueType | undefined {
    const node = graph.nodes[ref.nodeId]
    const port = node && getNodeDef(node.type)?.outputs.find((o) => o.name === ref.port)
    return port && concreteType(port.type, genTypeOf(ref.nodeId))
  }

  function genTypeOf(nodeId: string): ValueType {
    if (nodeId in memo) return memo[nodeId]
    const node = graph.nodes[nodeId]
    const def = node && getNodeDef(node.type)
    if (!def || visiting.has(nodeId)) return 'float'
    visiting.add(nodeId)
    let result: ValueType = 'float'
    for (const port of def.inputs) {
      if (port.type !== 'gen') continue
      const from = incoming.get(`${nodeId}\u0000${port.name}`)
      const t = from && outputType(from)
      if (t && t !== 'float') {
        result = t
        break
      }
    }
    visiting.delete(nodeId)
    memo[nodeId] = result
    return result
  }

  for (const id of Object.keys(graph.nodes)) genTypeOf(id)
  return memo
}

/** Does `nodeId` depend (directly or not) on `upstreamId`? */
function dependsOn(graph: Graph, nodeId: string, upstreamId: string): boolean {
  const seen = new Set<string>()
  const stack = [nodeId]
  while (stack.length) {
    const id = stack.pop()!
    if (id === upstreamId) return true
    if (seen.has(id)) continue
    seen.add(id)
    for (const e of graph.edges) if (e.to.nodeId === id) stack.push(e.from.nodeId)
  }
  return false
}

/**
 * Can a wire be drawn from output `from` to input `to`? Used by the editor to
 * refuse invalid connections as they are dragged. An existing wire on `to`
 * is considered as replaced.
 */
export function canConnect(graph: Graph, from: PortRef, to: PortRef): boolean {
  const fromNode = graph.nodes[from.nodeId]
  const toNode = graph.nodes[to.nodeId]
  if (!fromNode || !toNode || from.nodeId === to.nodeId) return false
  const output = getNodeDef(fromNode.type)?.outputs.find((o) => o.name === from.port)
  const input = getNodeDef(toNode.type)?.inputs.find((i) => i.name === to.port)
  if (!output || !input || input.connectable === false) return false
  if (dependsOn(graph, from.nodeId, to.nodeId)) return false

  const without: Graph = {
    nodes: graph.nodes,
    edges: graph.edges.filter((e) => !(e.to.nodeId === to.nodeId && e.to.port === to.port)),
  }
  const gen = resolveGenTypes(without)
  const sourceType = concreteType(output.type, gen[from.nodeId])
  if (input.type !== 'gen') return canConvert(sourceType, input.type)
  // Generic input: floats always fit, a vector must match the node's current vector type.
  return sourceType === 'float' || gen[to.nodeId] === 'float' || gen[to.nodeId] === sourceType
}

/** The end of a wire that is being dragged and has not found a port yet. */
export type WireAnchor =
  /** Dragged from an output: looking for an input to receive it. */
  | { direction: 'from'; nodeId: string; port: string }
  /** Dragged from an input: looking for an output to feed it. */
  | { direction: 'to'; nodeId: string; port: string }

/**
 * First port of a *new* node of type `nodeType` that could be wired to `anchor`,
 * or `null` if none can. Used to filter the palette when a wire is dropped
 * on empty space, and to connect the node once added.
 */
export function compatiblePort(graph: Graph, anchor: WireAnchor, nodeType: string): string | null {
  const def = getNodeDef(nodeType)
  if (!def || !graph.nodes[anchor.nodeId]) return null
  const probe = '\u0000new'
  const withNode: Graph = {
    nodes: { ...graph.nodes, [probe]: { id: probe, type: nodeType, position: { x: 0, y: 0 }, values: {} } },
    edges: graph.edges,
  }
  if (anchor.direction === 'from') {
    const from = { nodeId: anchor.nodeId, port: anchor.port }
    return def.inputs.find((p) => canConnect(withNode, from, { nodeId: probe, port: p.name }))?.name ?? null
  }
  const to = { nodeId: anchor.nodeId, port: anchor.port }
  return def.outputs.find((p) => canConnect(withNode, { nodeId: probe, port: p.name }, to))?.name ?? null
}

/**
 * The ports of a *new* node of type `nodeType` put in the middle of a wire: the input that takes
 * what the wire carried, and the output that feeds where it went. `null` if it cannot go there.
 */
export function insertPorts(graph: Graph, edgeId: string, nodeType: string): { input: string; output: string } | null {
  const edge = graph.edges.find((e) => e.id === edgeId)
  const def = getNodeDef(nodeType)
  if (!edge || !def) return null
  const probe = '\u0000new'
  const nodes = { ...graph.nodes, [probe]: { id: probe, type: nodeType, position: { x: 0, y: 0 }, values: {} } }
  const without = graph.edges.filter((e) => e.id !== edgeId)
  for (const input of def.inputs) {
    const fed: Graph = { nodes, edges: without }
    if (!canConnect(fed, edge.from, { nodeId: probe, port: input.name })) continue
    // Once fed, the new node's generic ports have their type: the output must suit the old target.
    const wired: Graph = { nodes, edges: [...without, { id: probe, from: edge.from, to: { nodeId: probe, port: input.name } }] }
    const output = def.outputs.find((o) => canConnect(wired, { nodeId: probe, port: o.name }, edge.to))
    if (output) return { input: input.name, output: output.name }
  }
  return null
}
