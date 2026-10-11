import { describe, expect, it } from 'vitest'
import {
  extractFragment,
  freeOffset,
  instantiateFragment,
  parseFragment,
  serializeFragment,
  type Graph,
} from './index'

const graph: Graph = {
  nodes: {
    t: { id: 't', type: 'time', position: { x: 0, y: 0 }, values: {} },
    m: { id: 'm', type: 'multiply', position: { x: 100, y: 0 }, values: { b: [2] } },
    s: { id: 's', type: 'sin', position: { x: 200, y: 0 }, values: {} },
    o: { id: 'o', type: 'output', position: { x: 300, y: 0 }, values: {} },
  },
  edges: [
    { id: 'e1', from: { nodeId: 't', port: 'time' }, to: { nodeId: 'm', port: 'a' } },
    { id: 'e2', from: { nodeId: 'm', port: 'result' }, to: { nodeId: 's', port: 'x' } },
    { id: 'e3', from: { nodeId: 's', port: 'result' }, to: { nodeId: 'o', port: 'color' } },
  ],
}

const counter = () => {
  let n = 0
  return () => `new${++n}`
}

describe('extractFragment', () => {
  it('keeps only the wires between selected nodes', () => {
    const f = extractFragment(graph, ['t', 'm'])!
    expect(f.nodes.map((n) => n.id)).toEqual(['t', 'm'])
    expect(f.edges.map((e) => e.id)).toEqual(['e1'])
  })

  it('never includes the Output node', () => {
    const f = extractFragment(graph, ['s', 'o'])!
    expect(f.nodes.map((n) => n.id)).toEqual(['s'])
    expect(f.edges).toEqual([])
    expect(extractFragment(graph, ['o'])).toBeNull()
  })

  it('returns null for an empty or unknown selection', () => {
    expect(extractFragment(graph, [])).toBeNull()
    expect(extractFragment(graph, ['ghost'])).toBeNull()
  })
})

describe('instantiateFragment', () => {
  it('creates new ids, remaps wires and moves nodes', () => {
    const f = extractFragment(graph, ['t', 'm', 's'])!
    const copy = instantiateFragment(f, { x: 10, y: 20 }, counter())
    expect(copy.nodes.map((n) => n.id)).toEqual(['new1', 'new2', 'new3'])
    expect(copy.nodes[1].position).toEqual({ x: 110, y: 20 })
    expect(copy.edges).toHaveLength(2)
    expect(copy.edges[0].from.nodeId).toBe('new1')
    expect(copy.edges[0].to.nodeId).toBe('new2')
    expect(copy.edges[1].to.nodeId).toBe('new3')
    // originals untouched
    expect(f.nodes[0].id).toBe('t')
  })

  it('does not share value arrays with the original', () => {
    const f = extractFragment(graph, ['m'])!
    const copy = instantiateFragment(f, { x: 0, y: 0 }, counter())
    copy.nodes[0].values.b[0] = 99
    expect(graph.nodes.m.values.b).toEqual([2])
  })
})

describe('clipboard text', () => {
  it('round-trips a fragment', () => {
    const f = extractFragment(graph, ['t', 'm'])!
    expect(parseFragment(serializeFragment(f))).toEqual(f)
  })

  it('rejects text that is not a fragment', () => {
    expect(parseFragment('hello')).toBeNull()
    expect(parseFragment('{"format":"other"}')).toBeNull()
    expect(parseFragment('null')).toBeNull()
  })

  it('drops unknown nodes, Output nodes and dangling wires', () => {
    const text = JSON.stringify({
      format: 'shadeflow-fragment',
      version: 1,
      nodes: {
        a: { id: 'a', type: 'time' },
        b: { id: 'b', type: 'nope' },
        c: { id: 'c', type: 'output' },
      },
      edges: [{ id: 'e', from: { nodeId: 'a', port: 'time' }, to: { nodeId: 'b', port: 'x' } }],
    })
    const f = parseFragment(text)!
    expect(f.nodes.map((n) => n.id)).toEqual(['a'])
    expect(f.edges).toEqual([])
  })
})

describe('freeOffset', () => {
  it('shifts diagonally until the first node lands on free space', () => {
    const f = extractFragment(graph, ['t'])!
    expect(freeOffset(graph, f)).toEqual({ x: 40, y: 40 })
    const crowded: Graph = {
      ...graph,
      nodes: {
        ...graph.nodes,
        x1: { id: 'x1', type: 'time', position: { x: 40, y: 40 }, values: {} },
        x2: { id: 'x2', type: 'time', position: { x: 80, y: 80 }, values: {} },
      },
    }
    expect(freeOffset(crowded, f)).toEqual({ x: 120, y: 120 })
  })
})
