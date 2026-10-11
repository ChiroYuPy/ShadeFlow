import { describe, expect, it } from 'vitest'
import {
  compileGraph,
  compileToGLSL,
} from './index'
import { build, glsl, mainBody } from './testUtils'

describe('compileToGLSL', () => {
  it('compiles a constant color', () => {
    const g = build()
    g.node('output', { color: [0.2, 0.4, 0.6] })
    expect(mainBody(glsl(g.graph))).toContain('fragColor = vec4(vec3(0.2, 0.4, 0.6), 1.0);')
  })

  it('compiles an animated gradient with readable variable names', () => {
    const g = build()
    const uv = g.node('uv')
    const split = g.node('split')
    const time = g.node('time')
    const add = g.node('add')
    const fract = g.node('fract')
    const out = g.node('output')
    g.wire(uv, 'uv', split, 'value')
    g.wire(split, 'x', add, 'a')
    g.wire(time, 'time', add, 'b')
    g.wire(add, 'result', fract, 'x')
    g.wire(fract, 'result', out, 'color') // float → vec3 splat

    const code = glsl(g.graph)
    expect(code).toContain('#version 300 es')
    expect(code).toContain('uniform float u_time;')
    expect(code).toContain('float x_1 = uv.x;')
    expect(code).toContain('float add_1 = x_1 + u_time;')
    expect(code).toContain('float fract_1 = fract(add_1);')
    expect(code).toContain('vec3 vec3_1 = vec3(fract_1);')
    expect(code).toContain('fragColor = vec4(vec3_1, 1.0);')
  })

  it('uses node default values for unconnected inputs', () => {
    const g = build()
    const time = g.node('time')
    const mul = g.node('multiply', { b: [2.5] })
    const out = g.node('output')
    g.wire(time, 'time', mul, 'a')
    g.wire(mul, 'result', out, 'color')
    expect(glsl(g.graph)).toContain('float mul_1 = u_time * 2.5;')
  })

  it('splats floats into the vector type of the other input', () => {
    const g = build()
    const uv = g.node('uv')
    const add = g.node('add', { b: [0.5] })
    const len = g.node('length')
    const out = g.node('output')
    g.wire(uv, 'uv', add, 'a')
    g.wire(add, 'result', len, 'value')
    g.wire(len, 'result', out, 'color')
    const code = glsl(g.graph)
    expect(code).toContain('vec2 add_1 = uv + vec2(0.5);')
    expect(code).toContain('float length_1 = length(add_1);')
  })

  it('wraps negative literals so they are safe in expressions', () => {
    const g = build()
    const time = g.node('time')
    const sub = g.node('subtract', { b: [-1] })
    const out = g.node('output')
    g.wire(time, 'time', sub, 'a')
    g.wire(sub, 'result', out, 'color')
    expect(glsl(g.graph)).toContain('float sub_1 = u_time - (-1.0);')
  })

  it('shares identical computations', () => {
    const g = build()
    const t = g.node('time')
    const s1 = g.node('sin')
    const s2 = g.node('sin')
    const add = g.node('add')
    const out = g.node('output')
    g.wire(t, 'time', s1, 'x')
    g.wire(t, 'time', s2, 'x')
    g.wire(s1, 'result', add, 'a')
    g.wire(s2, 'result', add, 'b')
    g.wire(add, 'result', out, 'color')
    const code = glsl(g.graph)
    expect(code.match(/sin\(/g)).toHaveLength(1)
    expect(code).toContain('float add_1 = sin_1 + sin_1;')
  })

  it('drops unused split components', () => {
    const g = build()
    const uv = g.node('uv')
    const split = g.node('split')
    const out = g.node('output')
    g.wire(uv, 'uv', split, 'value')
    g.wire(split, 'y', out, 'color')
    const code = glsl(g.graph)
    expect(code).toContain('uv.y')
    expect(code).not.toContain('uv.x')
  })

  it('only emits the noise helper when noise is used', () => {
    const g = build()
    const uv = g.node('uv')
    const noise = g.node('noise')
    const out = g.node('output')
    expect(glsl(g.graph)).not.toContain('sf_noise')
    g.wire(uv, 'uv', noise, 'position')
    g.wire(noise, 'result', out, 'color')
    expect(glsl(g.graph)).toContain('float sf_noise(vec2 p)')
  })

  it('compiles the value of a node for previews', () => {
    const g = build()
    const uv = g.node('uv')
    const split = g.node('split')
    g.node('output') // present but not used by the preview
    g.wire(uv, 'uv', split, 'value')
    const code = glsl(g.graph, { root: { nodeId: uv, port: 'uv' } })
    expect(code).toContain('vec3 vec3_1 = vec3(x_1, y_1, 0.0);')
  })
})

describe('compile errors', () => {
  const error = (g: ReturnType<typeof build>) => {
    const r = compileToGLSL(g.graph)
    if (r.ok) throw new Error('expected an error')
    return r.diagnostics[0]
  }

  it('requires an Output node', () => {
    expect(error(build()).message).toMatch(/Output node/)
  })

  it('rejects vectors of different sizes', () => {
    const g = build()
    const uv = g.node('uv') // vec2
    const col = g.node('color') // vec3
    const add = g.node('add')
    const out = g.node('output')
    g.wire(uv, 'uv', add, 'a')
    g.wire(col, 'color', add, 'b')
    g.wire(add, 'result', out, 'color')
    const d = error(g)
    expect(d.nodeId).toBe(add)
    expect(d.message).toMatch(/same size/)
  })

  it('rejects narrowing conversions', () => {
    const g = build()
    const uv = g.node('uv')
    const out = g.node('output')
    g.wire(uv, 'uv', out, 'color') // vec2 → vec3
    const d = error(g)
    expect(d.nodeId).toBe(out)
    expect(d.message).toMatch(/Cannot connect a vec2/)
  })

  it('detects loops', () => {
    const g = build()
    const a = g.node('add')
    const b = g.node('sin')
    const out = g.node('output')
    g.wire(a, 'result', b, 'x')
    g.wire(b, 'result', a, 'a')
    g.wire(a, 'result', out, 'color')
    expect(error(g).message).toMatch(/loop/)
  })

  it('rejects a Split component the input does not have', () => {
    const g = build()
    const uv = g.node('uv')
    const split = g.node('split')
    const out = g.node('output')
    g.wire(uv, 'uv', split, 'value')
    g.wire(split, 'z', out, 'color')
    expect(error(g).nodeId).toBe(split)
  })
})

describe('several problems at once', () => {
  const messages = (g: ReturnType<typeof build>, diagnoseAll = false) => {
    const r = compileGraph(g.graph, { diagnoseAll })
    return r.diagnostics.map((d) => `${d.nodeId}: ${d.message}`)
  }

  /** Output.color ← mix(a, b) where each branch mixes a vec2 and a vec3. */
  function twoBrokenBranches() {
    const g = build()
    const uv = g.node('uv')
    const col = g.node('color')
    const addA = g.node('add')
    const addB = g.node('add')
    const mix = g.node('mix')
    const out = g.node('output')
    g.wire(uv, 'uv', addA, 'a')
    g.wire(col, 'color', addA, 'b')
    g.wire(uv, 'uv', addB, 'a')
    g.wire(col, 'color', addB, 'b')
    g.wire(addA, 'result', mix, 'a')
    g.wire(addB, 'result', mix, 'b')
    g.wire(mix, 'result', out, 'color')
    return { g, addA, addB, mix, out }
  }

  it('reports independent problems together, each on its own node', () => {
    const { g, addA, addB } = twoBrokenBranches()
    const r = compileGraph(g.graph)
    expect(r.ok).toBe(false)
    expect(r.diagnostics.map((d) => d.nodeId).sort()).toEqual([addA, addB].sort())
  })

  it('does not blame nodes downstream of a problem', () => {
    const { g, mix, out } = twoBrokenBranches()
    const ids = compileGraph(g.graph).diagnostics.map((d) => d.nodeId)
    expect(ids).not.toContain(mix)
    expect(ids).not.toContain(out)
  })

  it('reports each problem once, even when a node feeds several others', () => {
    const g = build()
    const uv = g.node('uv')
    const col = g.node('color')
    const bad = g.node('add')
    const s1 = g.node('sin')
    const s2 = g.node('cos')
    const sum = g.node('add')
    const out = g.node('output')
    g.wire(uv, 'uv', bad, 'a')
    g.wire(col, 'color', bad, 'b')
    g.wire(bad, 'result', s1, 'x')
    g.wire(bad, 'result', s2, 'x')
    g.wire(s1, 'result', sum, 'a')
    g.wire(s2, 'result', sum, 'b')
    g.wire(sum, 'result', out, 'color')
    expect(messages(g)).toHaveLength(1)
  })

  it('flags broken nodes that are not connected yet, without failing the compile', () => {
    const g = build()
    const col = g.node('color')
    g.node('output', { color: [1, 0, 0] })
    const uv = g.node('uv')
    const loose = g.node('add')
    g.wire(uv, 'uv', loose, 'a')
    g.wire(col, 'color', loose, 'b')

    const quiet = compileGraph(g.graph)
    expect(quiet.ok).toBe(true)
    expect(quiet.diagnostics).toEqual([])

    const thorough = compileGraph(g.graph, { diagnoseAll: true })
    expect(thorough.ok).toBe(true) // the result itself is fine
    expect(thorough.diagnostics.map((d) => d.nodeId)).toEqual([loose])
  })

  it('still reports problems elsewhere when the Output node is missing', () => {
    const g = build()
    const uv = g.node('uv')
    const col = g.node('color')
    const add = g.node('add')
    g.wire(uv, 'uv', add, 'a')
    g.wire(col, 'color', add, 'b')
    const r = compileGraph(g.graph, { diagnoseAll: true })
    expect(r.ok).toBe(false)
    expect(r.diagnostics.some((d) => d.nodeId === undefined && /Output/.test(d.message))).toBe(true)
    expect(r.diagnostics.some((d) => d.nodeId === add)).toBe(true)
  })

  it('ignores notes', () => {
    const g = build()
    g.node('output')
    g.node('note')
    expect(compileGraph(g.graph, { diagnoseAll: true }).diagnostics).toEqual([])
  })
})
