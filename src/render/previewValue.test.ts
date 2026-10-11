import { describe, expect, it } from 'vitest'
import { compileGraph, type Graph } from '@/core'
import { describeValue, previewKindOf } from './previewValue'

const graphWith = (type: string, extra: Graph['nodes'] = {}, edges: Graph['edges'] = []): Graph => ({
  nodes: { n: { id: 'n', type, position: { x: 0, y: 0 }, values: {} }, ...extra },
  edges,
})

function kind(graph: Graph, port: string) {
  const r = compileGraph(graph, { root: { nodeId: 'n', port } })
  if (!r.ok) throw new Error('compile failed')
  return previewKindOf(r.ir)
}

describe('previewKindOf', () => {
  it('is an image when the value depends on the screen position', () => {
    expect(kind(graphWith('uv'), 'uv')).toBe('image')
    expect(kind(graphWith('centered-uv'), 'uv')).toBe('image')
  })

  it('is a value when it is the same everywhere', () => {
    expect(kind(graphWith('time'), 'time')).toBe('value')
    expect(kind(graphWith('resolution'), 'resolution')).toBe('value')
    expect(kind(graphWith('sin'), 'result')).toBe('value')
    expect(kind(graphWith('hsv'), 'color')).toBe('value')
  })

  it('follows what is wired in', () => {
    const g = graphWith('sin', { u: { id: 'u', type: 'uv', position: { x: 0, y: 0 }, values: {} } }, [
      { id: 'e', from: { nodeId: 'u', port: 'uv' }, to: { nodeId: 'n', port: 'x' } },
    ])
    expect(kind(g, 'result')).toBe('image')
  })
})

describe('describeValue', () => {
  it('prints numbers compactly', () => {
    expect(describeValue('float', [0.30000000004, 0, 0]).text).toBe('0.3')
    expect(describeValue('float', [-0.0001, 0, 0]).text).toBe('0')
    expect(describeValue('float', [12.34567, 0, 0]).text).toBe('12.346')
    expect(describeValue('vec2', [0.5, 1, 0]).text).toBe('0.5, 1')
  })

  it('gives vec3 values a color swatch', () => {
    const d = describeValue('vec3', [1, 0.5, 0])
    expect(d.text).toBe('1, 0.5, 0')
    expect(d.swatch).toBe('rgb(255 128 0)')
    expect(describeValue('float', [1, 1, 1]).swatch).toBeNull()
  })
})
