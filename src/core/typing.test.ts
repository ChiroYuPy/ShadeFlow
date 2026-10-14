import { describe, expect, it } from 'vitest'
import { canConnect, compatiblePort, insertPorts, resolveGenTypes, type Graph } from './index'

function graphOf(types: Record<string, string>, wires: [string, string, string, string][]): Graph {
  const nodes: Graph['nodes'] = {}
  for (const [id, type] of Object.entries(types)) nodes[id] = { id, type, position: { x: 0, y: 0 }, values: {} }
  const edges = wires.map(([a, ap, b, bp], i) => ({
    id: `e${i}`,
    from: { nodeId: a, port: ap },
    to: { nodeId: b, port: bp },
  }))
  return { nodes, edges }
}

describe('resolveGenTypes', () => {
  it('follows the vector type through generic nodes', () => {
    const g = graphOf({ uv: 'uv', add: 'add', sin: 'sin', t: 'time', mul: 'multiply' }, [
      ['uv', 'uv', 'add', 'a'],
      ['add', 'result', 'sin', 'x'],
      ['t', 'time', 'mul', 'a'],
    ])
    const types = resolveGenTypes(g)
    expect(types.add).toBe('vec2')
    expect(types.sin).toBe('vec2')
    expect(types.mul).toBe('float')
  })
})

describe('canConnect', () => {
  const g = graphOf({ uv: 'uv', col: 'color', add: 'add', out: 'output', time: 'time', sin: 'sin' }, [
    ['uv', 'uv', 'add', 'a'],
  ])
  const ref = (nodeId: string, port: string) => ({ nodeId, port })

  it('accepts floats and matching vectors on generic inputs', () => {
    expect(canConnect(g, ref('time', 'time'), ref('add', 'b'))).toBe(true)
    expect(canConnect(g, ref('uv', 'uv'), ref('add', 'b'))).toBe(true)
  })

  it('refuses a vector of another size on a generic input', () => {
    expect(canConnect(g, ref('col', 'color'), ref('add', 'b'))).toBe(false)
  })

  it('allows replacing the only wire of a node with another vector size', () => {
    expect(canConnect(g, ref('col', 'color'), ref('add', 'a'))).toBe(true)
  })

  it('refuses narrowing conversions and non-connectable ports', () => {
    expect(canConnect(g, ref('uv', 'uv'), ref('out', 'color'))).toBe(false)
    expect(canConnect(g, ref('time', 'time'), ref('col', 'color'))).toBe(false)
  })

  it('refuses loops', () => {
    const loop = graphOf({ a: 'sin', b: 'cos' }, [['a', 'result', 'b', 'x']])
    expect(canConnect(loop, ref('b', 'result'), ref('a', 'x'))).toBe(false)
    expect(canConnect(loop, ref('a', 'result'), ref('a', 'x'))).toBe(false)
  })
})

describe('compatiblePort', () => {
  const g = graphOf({ uv: 'uv', time: 'time', out: 'output' }, [])

  it('finds the first input that can receive an output', () => {
    expect(compatiblePort(g, { direction: 'from', nodeId: 'uv', port: 'uv' }, 'add')).toBe('a')
    expect(compatiblePort(g, { direction: 'from', nodeId: 'uv', port: 'uv' }, 'noise')).toBe('position')
    // a vec2 cannot go in a float input
    expect(compatiblePort(g, { direction: 'from', nodeId: 'uv', port: 'uv' }, 'vec2')).toBeNull()
  })

  it('finds the output able to feed an input', () => {
    expect(compatiblePort(g, { direction: 'to', nodeId: 'out', port: 'color' }, 'color')).toBe('color')
    expect(compatiblePort(g, { direction: 'to', nodeId: 'out', port: 'color' }, 'uv')).toBeNull()
    expect(compatiblePort(g, { direction: 'to', nodeId: 'out', port: 'color' }, 'sin')).toBe('result')
  })
})

describe('insertPorts', () => {
  const g = graphOf({ time: 'time', sin: 'sin', col: 'color', out: 'output' }, [
    ['time', 'time', 'sin', 'x'],
    ['col', 'color', 'out', 'color'],
  ])

  it('finds the input and output a node in the middle of a wire would use', () => {
    expect(insertPorts(g, 'e0', 'multiply')).toEqual({ input: 'a', output: 'result' })
    expect(insertPorts(g, 'e1', 'sin')).toEqual({ input: 'x', output: 'result' })
  })

  it('refuses nodes that take nothing, and unknown wires', () => {
    expect(insertPorts(g, 'e0', 'time')).toBeNull()
    expect(insertPorts(g, 'nope', 'multiply')).toBeNull()
  })
})
