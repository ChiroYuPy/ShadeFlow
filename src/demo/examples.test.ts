import { describe, expect, it } from 'vitest'
import { canConnect, compileGraph, getNodeDef, NOTE_TYPE, parseProject, serializeProject } from '@/core'
import { EXAMPLES } from './examples'

describe.each(EXAMPLES)('example "$name"', ({ graph }) => {
  it('compiles', () => {
    const result = compileGraph(graph)
    expect(result.ok, JSON.stringify(!result.ok && result.diagnostics)).toBe(true)
  })

  it('only uses known nodes, and every wire is a valid connection', () => {
    for (const node of Object.values(graph.nodes)) {
      expect(node.type === NOTE_TYPE || getNodeDef(node.type), `${node.id} (${node.type})`).toBeTruthy()
    }
    for (const edge of graph.edges) {
      expect(canConnect(graph, edge.from, edge.to), edge.id).toBe(true)
    }
  })

  it('has exactly one Output and explains itself with notes', () => {
    const nodes = Object.values(graph.nodes)
    expect(nodes.filter((n) => n.type === 'output')).toHaveLength(1)
    expect(nodes.filter((n) => n.type === NOTE_TYPE).length).toBeGreaterThan(0)
  })

  it('survives saving and reopening', () => {
    expect(parseProject(serializeProject(graph))).toEqual(graph)
  })
})

describe('examples list', () => {
  it('has unique ids', () => {
    expect(new Set(EXAMPLES.map((e) => e.id)).size).toBe(EXAMPLES.length)
  })
})
