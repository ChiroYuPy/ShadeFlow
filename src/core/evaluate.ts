import type { IRInputName, IRModule } from './ir/ir'

/**
 * Tiny CPU interpreter for IR modules. It computes the same numbers as the shader
 * for one point: used by tests (to check what a graph computes, not just what code
 * it prints) and by node previews to show the value of nodes that do not vary
 * across the screen.
 */

export interface Inputs {
  uv: [number, number]
  time: number
  resolution: [number, number]
}

const DEFAULT_INPUTS: Inputs = { uv: [0.5, 0.5], time: 0, resolution: [200, 100] }

type Fn = (...args: number[]) => number

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const fract = (x: number) => x - Math.floor(x)

// Same formulas as the shader helper `sf_noise` (see codegen).
function hash(px: number, py: number): number {
  let x = fract(px * 123.34)
  let y = fract(py * 456.21)
  const d = x * (x + 45.32) + y * (y + 45.32)
  x += d
  y += d
  return fract(x * y)
}

function noise(px: number, py: number): number {
  const ix = Math.floor(px)
  const iy = Math.floor(py)
  const fx = fract(px)
  const fy = fract(py)
  const ux = fx * fx * (3 - 2 * fx)
  const uy = fy * fy * (3 - 2 * fy)
  const mix = (a: number, b: number, t: number) => a + (b - a) * t
  return mix(
    mix(hash(ix, iy), hash(ix + 1, iy), ux),
    mix(hash(ix, iy + 1), hash(ix + 1, iy + 1), ux),
    uy,
  )
}

/** Componentwise functions, applied per component. */
const COMPONENTWISE: Record<string, Fn> = {
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
  mul: (a, b) => a * b,
  div: (a, b) => a / b,
  sin: Math.sin,
  cos: Math.cos,
  abs: Math.abs,
  fract,
  floor: Math.floor,
  min: Math.min,
  max: Math.max,
  pow: Math.pow,
  mod: (x, y) => x - y * Math.floor(x / y),
  clamp: (x, lo, hi) => Math.min(hi, Math.max(lo, x)),
  mix: (a, b, t) => a + (b - a) * t,
  step: (edge, x) => (x < edge ? 0 : 1),
  smoothstep: (e0, e1, x) => {
    const t = clamp01((x - e0) / (e1 - e0))
    return t * t * (3 - 2 * t)
  },
}

/** Evaluate the final color (vec3) of a module. */
export function evaluate(ir: IRModule, inputs: Partial<Inputs> = {}): number[] {
  const given = { ...DEFAULT_INPUTS, ...inputs }
  const values = new Map<number, number[]>()
  const get = (id: number) => values.get(id)!

  for (const instr of ir.instructions) {
    const e = instr.expr
    let out: number[]
    switch (e.kind) {
      case 'const':
        out = e.value
        break
      case 'input': {
        const v = given[e.name as IRInputName]
        out = typeof v === 'number' ? [v] : [...v]
        break
      }
      case 'construct': {
        const parts = e.args.map(get)
        // One float is splatted to the whole vector; otherwise components are concatenated.
        out = parts.length === 1 ? Array<number>(vectorSize(instr.type)).fill(parts[0][0]) : parts.flat()
        break
      }
      case 'swizzle':
        out = [...e.components].map((c) => get(e.arg)['xyzw'.indexOf(c)])
        break
      case 'op': {
        const args = e.args.map(get)
        if (e.op === 'length') {
          out = [Math.hypot(...args[0])]
        } else if (e.op === 'noise') {
          out = [noise(args[0][0], args[0][1])]
        } else {
          const fn = COMPONENTWISE[e.op]
          out = args[0].map((_, i) => fn(...args.map((a) => a[i])))
        }
        break
      }
    }
    values.set(instr.id, out)
  }
  return get(ir.result)
}

function vectorSize(type: string): number {
  return { float: 1, vec2: 2, vec3: 3, vec4: 4 }[type] ?? 1
}
