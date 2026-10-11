import { describe, expect, it } from 'vitest'
import {
  compileGraph,
  generateCode,
  generateGLSL,
  generateHLSL,
  generateWGSL,
  getNodeDef,
  listNodeDefs,
  type GraphNode,
} from './index'
import { evaluate } from './evaluate'
import { build } from './testUtils'

describe('node catalogue', () => {
  it('compiles every node, with default values, to all three languages', () => {
    for (const def of listNodeDefs()) {
      const g = build()
      const id = g.node(def.type)
      const root = { nodeId: id, port: def.outputs[0].name }
      const result = compileGraph(g.graph, { root })
      expect(result.ok, `${def.type} should compile`).toBe(true)
      if (!result.ok) continue
      expect(generateGLSL(result.ir)).toContain('void main()')
      expect(generateWGSL(result.ir)).toContain('@fragment')
      expect(generateHLSL(result.ir)).toContain('SV_Target')
    }
  })

  it('gives every node a description and unique port names', () => {
    for (const def of listNodeDefs()) {
      expect(def.description.length, def.type).toBeGreaterThan(10)
      const ports = [...def.inputs, ...def.outputs].map((p) => p.name)
      expect(new Set(def.inputs.map((p) => p.name)).size, def.type).toBe(def.inputs.length)
      expect(new Set(def.outputs.map((p) => p.name)).size, def.type).toBe(def.outputs.length)
      expect(ports.length).toBeGreaterThan(0)
    }
  })
})

describe('new nodes', () => {
  const compile = (
    setup: (g: ReturnType<typeof build>) => string,
    language: 'glsl' | 'wgsl' | 'hlsl' = 'glsl',
    port = 'result',
  ) => {
    const g = build()
    const last = setup(g)
    const result = compileGraph(g.graph, { root: { nodeId: last, port } })
    if (!result.ok) throw new Error(result.diagnostics[0].message)
    return generateCode(result.ir, language)
  }

  it('Centered UV corrects for the aspect ratio using plain operations', () => {
    const g = build()
    const c = g.node('centered-uv')
    const result = compileGraph(g.graph, { root: { nodeId: c, port: 'uv' } })
    if (!result.ok) throw new Error('compile failed')
    const code = generateGLSL(result.ir)
    expect(code).toContain('u_resolution.x')
    expect(code).toContain('/ y_1')
    expect(code).toContain('uv - vec2(0.5)')
  })

  it('Mod wraps like a floored remainder in every language', () => {
    const mod = (g: ReturnType<typeof build>) => g.node('mod')
    expect(compile(mod, 'glsl')).toContain('mod(1.5, 1.0)')
    // WGSL and HLSL have no floored mod: it is spelled out so negatives behave the same.
    expect(compile(mod, 'wgsl')).toContain('1.5 - 1.0 * floor(1.5 / 1.0)')
    expect(compile(mod, 'hlsl')).toContain('1.5 - 1.0 * floor(1.5 / 1.0)')
  })

  it('One Minus follows the vector type of its input', () => {
    const code = compile((g) => {
      const uv = g.node('uv')
      const om = g.node('one-minus')
      g.wire(uv, 'uv', om, 'x')
      return om
    })
    expect(code).toContain('vec2 sub_1 = vec2(1.0) - uv;')
  })

  it('Rotate and Remap are built from basic operations', () => {
    const rotate = compile((g) => g.node('rotate', { angle: [1.5] }), 'glsl', 'position')
    expect(rotate).toContain('cos(1.5)')
    expect(rotate).toContain('sin(1.5)')
    const remap = compile((g) => g.node('remap', { value: [0.25] }))
    expect(remap).toContain('float div_1 = sub_1 / sub_2;')
  })
})

describe('what nodes compute', () => {
  /** Evaluate the first output of a node (a lone node, optional values) as a color. */
  const run = (
    type: string,
    values: GraphNode['values'] = {},
    inputs: Parameters<typeof evaluate>[1] = {},
    port?: string,
  ) => {
    const g = build()
    const id = g.node(type, values)
    const result = compileGraph(g.graph, { root: { nodeId: id, port: port ?? getNodeDef(type)!.outputs[0].name } })
    if (!result.ok) throw new Error(result.diagnostics[0].message)
    return evaluate(result.ir, inputs)
  }
  const close = (actual: number[], expected: number[]) =>
    expected.forEach((e, i) => expect(actual[i]).toBeCloseTo(e, 3))

  it('HSV walks around the rainbow', () => {
    close(run('hsv', { hue: [0] }), [1, 0, 0])
    close(run('hsv', { hue: [1 / 3] }), [0, 1, 0])
    close(run('hsv', { hue: [2 / 3] }), [0, 0, 1])
    close(run('hsv', { hue: [1] }), [1, 0, 0]) // wraps
    close(run('hsv', { hue: [-1 / 3] }), [0, 0, 1]) // negative hues wrap too
    close(run('hsv', { hue: [0], saturation: [0], value: [0.5] }), [0.5, 0.5, 0.5]) // no saturation = gray
    close(run('hsv', { hue: [0], value: [0] }), [0, 0, 0])
  })

  it('Cosine Palette matches A + B cos(2π(C t + D))', () => {
    const [r, g, b] = run('cosine-palette')
    expect(r).toBeCloseTo(0.5 + 0.5 * Math.cos(0), 3)
    expect(g).toBeCloseTo(0.5 + 0.5 * Math.cos(2 * Math.PI * 0.33), 3)
    expect(b).toBeCloseTo(0.5 + 0.5 * Math.cos(2 * Math.PI * 0.67), 3)
  })

  it('Rotate turns a position counter-clockwise', () => {
    close(run('rotate', { position: [1, 0], angle: [Math.PI / 2] }, {}, 'position').slice(0, 2), [0, 1])
    close(run('rotate', { position: [1, 1], angle: [Math.PI] }, {}, 'position').slice(0, 2), [-1, -1])
  })

  it('Remap converts ranges, by default -1…1 to 0…1', () => {
    close(run('remap', { value: [-1] }), [0])
    close(run('remap', { value: [0] }), [0.5])
    close(run('remap', { value: [1] }), [1])
    close(run('remap', { value: [5], fromMin: [0], fromMax: [10], toMin: [100], toMax: [200] }), [150])
  })

  it('Mod wraps negative numbers upward', () => {
    close(run('mod', { value: [-0.5], divisor: [1] }), [0.5])
    close(run('mod', { value: [7], divisor: [3] }), [1])
  })

  it('Centered UV is centered and keeps circles round', () => {
    close(run('centered-uv', {}, { uv: [0.5, 0.5], resolution: [200, 100] }), [0, 0])
    // one unit of height on screen = one unit horizontally: x spans ±aspect/2
    close(run('centered-uv', {}, { uv: [1, 1], resolution: [200, 100] }), [1, 0.5])
    close(run('centered-uv', {}, { uv: [0, 0], resolution: [100, 100] }), [-0.5, -0.5])
  })

  it('One Minus, Clamp, Floor and Power behave', () => {
    close(run('one-minus', { x: [0.25] }), [0.75])
    close(run('clamp', { x: [2], min: [0], max: [1] }), [1])
    close(run('floor', { x: [-0.5] }), [-1])
    close(run('pow', { base: [3], exponent: [2] }), [9])
  })
})

describe('CPU noise', () => {
  it('stays in 0…1, is continuous, and varies', () => {
    const g = build()
    const id = g.node('noise')
    const sample = (x: number, y: number) => {
      const r = compileGraph(g.graph, { root: { nodeId: id, port: 'result' } })
      if (!r.ok) throw new Error('compile failed')
      return evaluate(r.ir, { uv: [x, y] })[0]
    }
    // the node's position input is unwired: it is the constant (0, 0), so wire uv instead
    const uv = g.node('uv')
    g.wire(uv, 'uv', id, 'position')
    const values = [0.1, 0.5, 1.3, 2.7, 9.1].map((x) => sample(x, x * 0.7))
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
    expect(new Set(values.map((v) => v.toFixed(4))).size).toBeGreaterThan(2)
    expect(Math.abs(sample(3.0001, 2) - sample(3, 2))).toBeLessThan(0.01)
  })
})
