import { IRBuilder } from '../ir/builder'
import type { IRModule, ValueId } from '../ir/ir'
import { NOTE_TYPE, type Graph, type GraphEdge, type PortRef } from '../graph'
import { getNodeDef } from '../nodes/registry'
import { canConvert, componentCount, type ValueType } from '../types'

export interface Diagnostic {
  /** Node the problem is attached to, when there is one. */
  nodeId?: string
  message: string
}

export type CompileResult =
  /** `diagnostics` lists problems in nodes that do not feed the result (only with `diagnoseAll`). */
  | { ok: true; ir: IRModule; diagnostics: Diagnostic[] }
  | { ok: false; diagnostics: Diagnostic[] }

export interface CompileOptions {
  /**
   * Compile the value of this port instead of the Output node
   * (used for per-node previews). The value is shown as a color.
   */
  root?: PortRef
  /**
   * Also check nodes that do not feed the result, so every broken node can be
   * flagged in the editor. Their problems never prevent compilation.
   */
  diagnoseAll?: boolean
}

/** A problem to report. */
class CompileError extends Error {
  nodeId: string | undefined
  constructor(message: string, nodeId?: string) {
    super(message)
    this.nodeId = nodeId
  }
}

/** A node that cannot be compiled because something it depends on already reported an error. */
class Blocked extends Error {}

const portKey = (nodeId: string, port: string) => `${nodeId}\u0000${port}`

/** Resize a stored value to a type: a single number is splatted, otherwise padded/truncated. */
export function coerceConstant(values: number[], type: ValueType): number[] {
  const n = componentCount[type]
  if (values.length === n) return values
  if (values.length === 1) return Array<number>(n).fill(values[0])
  return Array.from({ length: n }, (_, i) => values[i] ?? 0)
}

export function compileGraph(graph: Graph, options: CompileOptions = {}): CompileResult {
  const diagnostics: Diagnostic[] = []
  const ir = lower(graph, options, diagnostics)
  return ir ? { ok: true, ir, diagnostics } : { ok: false, diagnostics }
}

/** Returns the IR, or `null` when the result cannot be computed (problems are in `diagnostics`). */
function lower(graph: Graph, options: CompileOptions, diagnostics: Diagnostic[]): IRModule | null {
  const b = new IRBuilder()
  const incoming = new Map<string, GraphEdge>()
  for (const edge of graph.edges) incoming.set(portKey(edge.to.nodeId, edge.to.port), edge)

  const memo = new Map<string, Record<string, ValueId>>()
  const failed = new Set<string>()
  const visiting = new Set<string>()

  function report(error: CompileError) {
    const duplicate = diagnostics.some((d) => d.nodeId === error.nodeId && d.message === error.message)
    if (!duplicate) diagnostics.push({ nodeId: error.nodeId, message: error.message })
  }

  /**
   * Lower one node and everything it depends on. Problems are reported once, on
   * the node that causes them; nodes downstream of a problem just fail silently.
   */
  function lowerNode(nodeId: string): Record<string, ValueId> {
    const done = memo.get(nodeId)
    if (done) return done
    if (failed.has(nodeId)) throw new Blocked()

    if (visiting.has(nodeId)) {
      const label = getNodeDef(graph.nodes[nodeId]?.type ?? '')?.label ?? 'Node'
      report(new CompileError(`${label} is part of a loop: a node cannot depend on itself`, nodeId))
      throw new Blocked()
    }

    visiting.add(nodeId)
    try {
      const outputs = lowerInputsAndEmit(nodeId)
      memo.set(nodeId, outputs)
      return outputs
    } catch (e) {
      failed.add(nodeId)
      if (e instanceof CompileError) report(e)
      else if (!(e instanceof Blocked)) throw e
      throw new Blocked()
    } finally {
      visiting.delete(nodeId)
    }
  }

  function lowerInputsAndEmit(nodeId: string): Record<string, ValueId> {
    const node = graph.nodes[nodeId]
    if (!node) throw new CompileError('A wire points to a node that does not exist')
    const def = getNodeDef(node.type)
    if (!def) throw new CompileError(`Unknown node type "${node.type}"`, nodeId)

    // 1. Lower everything wired into this node. A failing input does not stop the
    //    others, so independent problems are all reported in one go.
    const wired: Record<string, ValueId> = {}
    let blocked = false
    for (const port of def.inputs) {
      const edge = port.connectable === false ? undefined : incoming.get(portKey(nodeId, port.name))
      if (!edge) continue
      try {
        const source = lowerNode(edge.from.nodeId)[edge.from.port]
        if (source === undefined) {
          const srcLabel = getNodeDef(graph.nodes[edge.from.nodeId].type)?.label ?? 'Node'
          report(new CompileError(`${srcLabel} has no "${edge.from.port}" value for these inputs`, edge.from.nodeId))
          blocked = true
        } else {
          wired[port.name] = source
        }
      } catch (e) {
        if (!(e instanceof Blocked)) throw e
        blocked = true
      }
    }
    if (blocked) throw new Blocked()
    b.origin = nodeId

    // 2. Resolve the type shared by the generic ports.
    const vectorTypes = new Set<ValueType>()
    for (const port of def.inputs) {
      const id = wired[port.name]
      if (port.type === 'gen' && id !== undefined && b.typeOf(id) !== 'float') vectorTypes.add(b.typeOf(id))
    }
    if (vectorTypes.size > 1) {
      throw new CompileError(`${def.label} mixes ${[...vectorTypes].join(' and ')}: they must have the same size`, nodeId)
    }
    const genType: ValueType = [...vectorTypes][0] ?? 'float'

    // 3. Convert wired values / fill defaults for every input.
    const inputs: Record<string, ValueId> = {}
    for (const port of def.inputs) {
      const target = port.type === 'gen' ? genType : port.type
      const id = wired[port.name]
      if (id === undefined) {
        inputs[port.name] =
          port.default === 'uv'
            ? b.convert(b.input('uv'), target)
            : b.constant(target, coerceConstant(node.values[port.name] ?? port.default, target))
      } else if (canConvert(b.typeOf(id), target)) {
        inputs[port.name] = b.convert(id, target)
      } else {
        throw new CompileError(`Cannot connect a ${b.typeOf(id)} to "${port.label}" (${target})`, nodeId)
      }
    }

    // 4. Emit.
    return def.lower({ b, node, type: genType, inputs })
  }

  // The value the shader displays.
  let rootId: ValueId | null = null
  /** Node the final color comes from (the Output node, or the previewed node). */
  let rootOrigin: string | undefined
  try {
    if (options.root) {
      const { nodeId, port } = options.root
      const value = lowerNode(nodeId)[port]
      if (value === undefined) throw new CompileError(`This node has no "${port}" value`, nodeId)
      rootId = toColor(b, value)
      rootOrigin = nodeId
    } else {
      const output = Object.values(graph.nodes).find((n) => n.type === 'output')
      if (!output) throw new CompileError('Add an Output node to see a result')
      rootId = lowerNode(output.id).color
      rootOrigin = output.id
    }
  } catch (e) {
    if (e instanceof CompileError) report(e)
    else if (!(e instanceof Blocked)) throw e
  }

  // Nodes that do not feed the result: check them too, for the editor to flag.
  if (options.diagnoseAll) {
    for (const node of Object.values(graph.nodes)) {
      if (node.type === NOTE_TYPE) continue
      try {
        lowerNode(node.id)
      } catch (e) {
        if (!(e instanceof Blocked)) throw e
      }
    }
  }

  return rootId === null ? null : b.finish(rootId, rootOrigin)
}

/** Display conversion used by previews: any value → an RGB color. */
function toColor(b: IRBuilder, id: ValueId): ValueId {
  switch (b.typeOf(id)) {
    case 'float':
      return b.construct('vec3', [id])
    case 'vec2':
      return b.construct('vec3', [b.swizzle(id, 'x'), b.swizzle(id, 'y'), b.constant('float', [0])])
    case 'vec3':
      return id
    case 'vec4':
      return b.swizzle(id, 'xyz')
  }
}
