import { describe, expect, it } from 'vitest'
import { newGraph, parseProject, serializeProject, type Graph } from './index'

const sample: Graph = {
  nodes: {
    output: { id: 'output', type: 'output', position: { x: 10, y: 20 }, values: { color: [1, 0, 0] } },
    t: { id: 't', type: 'time', position: { x: 0, y: 0 }, values: {} },
    n: { id: 'n', type: 'note', position: { x: 5, y: 5 }, values: {}, text: 'hello' },
    s: { id: 's', type: 'split', position: { x: 1, y: 2 }, values: {}, previewPort: 'y', showPreview: true, collapsed: true },
  },
  edges: [],
}

describe('project files', () => {
  it('round-trips a graph', () => {
    expect(parseProject(serializeProject(sample))).toEqual(sample)
  })

  it('rejects things that are not projects', () => {
    expect(() => parseProject('nope')).toThrow(/JSON/)
    expect(() => parseProject('{"a":1}')).toThrow(/not a ShadeFlow project/)
    expect(() => parseProject('{"format":"shadeflow","version":99,"graph":{}}')).toThrow(/newer/)
  })

  it('drops unknown nodes and dangling wires, and restores a missing Output', () => {
    const text = JSON.stringify({
      format: 'shadeflow',
      version: 1,
      graph: {
        nodes: { a: { id: 'a', type: 'time' }, b: { id: 'b', type: 'does-not-exist' } },
        edges: [{ id: 'e', from: { nodeId: 'a', port: 'time' }, to: { nodeId: 'b', port: 'x' } }],
      },
    })
    const g = parseProject(text)
    expect(Object.keys(g.nodes).sort()).toEqual(['a', 'output'])
    expect(g.edges).toEqual([])
    expect(g.nodes.output).toEqual(newGraph().nodes.output)
  })
})

describe('sameShader', () => {
  it('ignores positions and note text, but not values, wires or node types', async () => {
    const { sameShader } = await import('./index')
    const moved: Graph = {
      ...sample,
      nodes: { ...sample.nodes, t: { ...sample.nodes.t, position: { x: 99, y: 99 } }, n: { ...sample.nodes.n, text: 'changed' } },
    }
    expect(sameShader(sample, moved)).toBe(true)
    const edited: Graph = {
      ...sample,
      nodes: { ...sample.nodes, output: { ...sample.nodes.output, values: { color: [0, 1, 0] } } },
    }
    expect(sameShader(sample, edited)).toBe(false)
    const rewired: Graph = { ...sample, edges: [{ id: 'e', from: { nodeId: 't', port: 'time' }, to: { nodeId: 'output', port: 'color' } }] }
    expect(sameShader(sample, rewired)).toBe(false)
    // the previewed output does not change the shader
    const previewed: Graph = {
      ...sample,
      nodes: { ...sample.nodes, s: { ...sample.nodes.s, previewPort: 'x' } },
    }
    expect(sameShader(sample, previewed)).toBe(true)
    // neither does showing or folding a node
    const folded: Graph = {
      ...sample,
      nodes: { ...sample.nodes, s: { ...sample.nodes.s, showPreview: false, collapsed: false } },
    }
    expect(sameShader(sample, folded)).toBe(true)
    const removed: Graph = { ...sample, nodes: { output: sample.nodes.output } }
    expect(sameShader(sample, removed)).toBe(false)
  })
})
