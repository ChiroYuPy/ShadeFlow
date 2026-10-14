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

  it('Rotate turns a position counter-clockwise, around its center', () => {
    const origin = { center: [0, 0] }
    close(run('rotate', { ...origin, angle: [Math.PI / 2] }, { uv: [1, 0] }, 'position').slice(0, 2), [0, 1])
    close(run('rotate', { ...origin, angle: [Math.PI] }, { uv: [1, 1] }, 'position').slice(0, 2), [-1, -1])
    // by default the center is the middle of the UV square, which therefore stays put
    close(run('rotate', { angle: [1.2] }, { uv: [0.5, 0.5] }, 'position').slice(0, 2), [0.5, 0.5])
    close(run('rotate', { angle: [Math.PI] }, { uv: [1, 0.5] }, 'position').slice(0, 2), [0, 0.5])
  })

  it('an unwired Position is the UV of the pixel', () => {
    close(run('tile', { count: [4] }, { uv: [0.3, 0.8] }, 'position').slice(0, 2), [0.2, 0.2])
    expect(run('circle', {}, { uv: [0.5, 0.5] })[0]).toBeCloseTo(1, 3)
    expect(run('circle', {}, { uv: [0.95, 0.95] })[0]).toBeCloseTo(0, 3)
  })

  it('Polar Coordinates give the distance and the direction from the center', () => {
    const polar = (uv: [number, number], port: string) => run('polar', {}, { uv }, port)[0]
    expect(polar([1, 0.5], 'radius')).toBeCloseTo(0.5, 5)
    expect(polar([1, 0.5], 'angle')).toBeCloseTo(0.5, 5) // right
    expect(polar([0.5, 1], 'angle')).toBeCloseTo(0.75, 5) // top
    expect(polar([0.5, 0], 'angle')).toBeCloseTo(0.25, 5) // bottom
  })

  it('Rectangle and Polygon are 1 inside and 0 outside', () => {
    const rect = (uv: [number, number]) => run('rectangle', { size: [0.6, 0.2] }, { uv })[0]
    expect(rect([0.5, 0.5])).toBeCloseTo(1, 3)
    expect(rect([0.75, 0.55])).toBeCloseTo(1, 3)
    expect(rect([0.75, 0.7])).toBeCloseTo(0, 3) // past the top side only
    expect(rect([0.9, 0.5])).toBeCloseTo(0, 3)

    // 4 sides: a square whose sides are at Radius from the center
    const square = (uv: [number, number]) => run('polygon', { sides: [4], radius: [0.3] }, { uv })[0]
    expect(square([0.5, 0.5])).toBeCloseTo(1, 3)
    expect(square([0.75, 0.75])).toBeCloseTo(1, 3) // in the corner, where a circle would not reach
    expect(square([0.85, 0.5])).toBeCloseTo(0, 3)
    expect(square([0.5, 0.15])).toBeCloseTo(0, 3)
  })

  it('Random only depends on its seed and has no pattern', () => {
    const at = (x: number, y: number) => run('random', {}, { uv: [x, y] })[0]
    expect(at(0.25, 0.75)).toBe(at(0.25, 0.75))
    const values: number[] = []
    for (let x = 0; x < 40; x++) for (let y = 0; y < 40; y++) values.push(at(x, y))
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...values)).toBeLessThan(1)
    const mean = values.reduce((a, b) => a + b) / values.length
    expect(mean).toBeGreaterThan(0.45)
    expect(mean).toBeLessThan(0.55)
    // neighbours are unrelated: on average they differ by a third, like two random numbers
    let difference = 0
    for (let i = 1; i < values.length; i++) difference += Math.abs(values[i] - values[i - 1])
    expect(difference / (values.length - 1)).toBeGreaterThan(0.28)
  })

  it('Mouse gives the pointer in UV space and in Centered UV space', () => {
    close(run('mouse', {}, { mouse: [0.2, 0.9] }, 'position').slice(0, 2), [0.2, 0.9])
    close(run('mouse', {}, { mouse: [0.5, 0.5] }, 'centered').slice(0, 2), [0, 0])
    // resolution is 200×100 in tests: X spans twice the height
    close(run('mouse', {}, { mouse: [1, 1] }, 'centered').slice(0, 2), [1, 0.5])
  })

  it('Fisheye pushes positions away from the center, more as they are far from it', () => {
    const at = (uv: [number, number], strength = 2) => run('fisheye', { strength: [strength] }, { uv }, 'position').slice(0, 2)
    close(at([0.5, 0.5]), [0.5, 0.5]) // the center stays put
    close(at([0.6, 0.5]), [0.5 + 0.1 * (1 + 2 * 0.01), 0.5])
    close(at([1, 0.5]), [0.5 + 0.5 * (1 + 2 * 0.25), 0.5])
    close(at([1, 0.5], 0), [1, 0.5]) // no strength, no change
    close(at([1, 0.5], -1), [0.5 + 0.5 * 0.75, 0.5]) // negative: pinched
  })

  it('Tile also gives the number of the copy', () => {
    close(run('tile', { count: [4] }, { uv: [0.3, 0.8] }, 'cell').slice(0, 2), [1, 3])
  })

  it('Noise scales its position', () => {
    const at = (scale: number, uv: [number, number]) => run('noise', { scale: [scale] }, { uv })[0]
    expect(at(10, [0.13, 0.27])).toBeCloseTo(at(1, [1.3, 2.7]), 5)
    expect(at(5, [0.1, 0.1])).not.toBeCloseTo(at(5, [0.7, 0.9]), 2)
  })

  it('Step and Smoothstep take X first, whatever the order of the shader function', () => {
    expect(getNodeDef('step')!.inputs[0].name).toBe('x')
    expect(getNodeDef('smoothstep')!.inputs[0].name).toBe('x')
    close(run('step', { x: [0.7], edge: [0.5] }), [1])
    close(run('step', { x: [0.2], edge: [0.5] }), [0])
    close(run('smoothstep', { x: [0.5], edge0: [0], edge1: [1] }), [0.5])
    close(run('smoothstep', { x: [2], edge0: [0], edge1: [1] }), [1])
  })

  it('Fractal Noise has as many layers as Detail, within bounds', () => {
    const layers = (detail: number) => {
      const g = build()
      const id = g.node('fractal-noise', { detail: [detail] })
      const result = compileGraph(g.graph, { root: { nodeId: id, port: 'result' } })
      if (!result.ok) throw new Error(result.diagnostics[0].message)
      return generateGLSL(result.ir).split('void main()')[1].match(/sf_noise\(/g)!.length
    }
    expect(layers(1)).toBe(1)
    expect(layers(3)).toBe(3)
    expect(layers(2.6)).toBe(3)
    expect(layers(0)).toBe(1)
    expect(layers(500)).toBe(8)
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

  it('Square Root, Sign, Ceil and Saturate behave', () => {
    close(run('sqrt', { x: [0.25] }), [0.5])
    close(run('sign', { x: [-3] }), [-1])
    close(run('sign', { x: [0] }), [0])
    close(run('ceil', { x: [1.25] }), [2])
    close(run('ceil', { x: [-1.5] }), [-1])
    close(run('saturate', { x: [1.5] }), [1])
    close(run('saturate', { x: [-2] }), [0])
  })

  it('Dot adds up the products, Normalize makes a length of 1', () => {
    const vectors = (type: 'dot' | 'normalize', port: string) => {
      const g = build()
      const a = g.node('vec2', { x: [3], y: [4] })
      const b = g.node('vec2', { x: [2], y: [0.5] })
      const node = g.node(type)
      g.wire(a, 'vector', node, type === 'dot' ? 'a' : 'value')
      if (type === 'dot') g.wire(b, 'vector', node, 'b')
      const result = compileGraph(g.graph, { root: { nodeId: node, port } })
      if (!result.ok) throw new Error(result.diagnostics[0].message)
      return evaluate(result.ir)
    }
    close(vectors('dot', 'result'), [3 * 2 + 4 * 0.5])
    close(vectors('normalize', 'result'), [0.6, 0.8, 0])
  })

  it('Tiling and Offset scales then moves', () => {
    close(run('tiling-offset', { tiling: [2, 3], offset: [0.5, 0] }, { uv: [0.25, 0.5] }, 'position'), [1, 1.5])
  })

  it('Checkerboard alternates from one square to the next', () => {
    const at = (x: number, y: number) => run('checkerboard', { count: [2] }, { uv: [x, y] })[0]
    expect(at(0.25, 0.25)).toBe(0)
    expect(at(0.75, 0.25)).toBe(1)
    expect(at(0.75, 0.75)).toBe(0)
  })

  it('Voronoi measures the distance to the nearest point and colors each cell', () => {
    // no randomness: the points sit on the grid corners, so the middle of a square is √0.5 away
    close(run('voronoi', { scale: [1], randomness: [0] }, { uv: [0.5, 0.5] }, 'distance'), [Math.SQRT1_2])
    close(run('voronoi', { scale: [1], randomness: [0] }, { uv: [0.1, 0.1] }, 'distance'), [Math.hypot(0.1, 0.1)])
    // scattered points: distances stay below the size of a square, cells take varied values in 0…1
    const cells = new Set<string>()
    for (let i = 0; i < 40; i++) {
      const uv: [number, number] = [(i * 0.37) % 1, (i * 0.61) % 1]
      const d = run('voronoi', { scale: [4] }, { uv }, 'distance')[0]
      const c = run('voronoi', { scale: [4] }, { uv }, 'cell')[0]
      expect(d).toBeGreaterThanOrEqual(0)
      expect(d).toBeLessThan(1.5)
      expect(c).toBeGreaterThanOrEqual(0)
      expect(c).toBeLessThanOrEqual(1)
      cells.add(c.toFixed(4))
    }
    expect(cells.size).toBeGreaterThan(5)
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
