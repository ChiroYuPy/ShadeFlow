import { compileToGLSL, type Graph, type GraphNode } from './index'

/** Tiny graph builder so tests read like the node editor. */
export function build() {
  const graph: Graph = { nodes: {}, edges: [] }
  let n = 0
  return {
    graph,
    node(type: string, values: GraphNode['values'] = {}): string {
      const id = `${type}${n++}`
      graph.nodes[id] = { id, type, position: { x: 0, y: 0 }, values }
      return id
    },
    wire(from: string, fromPort: string, to: string, toPort: string) {
      graph.edges.push({
        id: `e${graph.edges.length}`,
        from: { nodeId: from, port: fromPort },
        to: { nodeId: to, port: toPort },
      })
    },
  }
}

export function glsl(graph: Graph, options?: Parameters<typeof compileToGLSL>[1]) {
  const r = compileToGLSL(graph, options)
  if (!r.ok) throw new Error(r.diagnostics.map((d) => d.message).join('\n'))
  return r.code
}

export const mainBody = (code: string) => code.slice(code.indexOf('void main()'))
