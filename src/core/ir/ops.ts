import type { ValueType } from '../types'

export type OpName =
  | 'add'
  | 'sub'
  | 'mul'
  | 'div'
  | 'sin'
  | 'cos'
  | 'abs'
  | 'fract'
  | 'mix'
  | 'smoothstep'
  | 'step'
  | 'floor'
  | 'min'
  | 'max'
  | 'pow'
  | 'mod'
  | 'clamp'
  | 'length'
  | 'noise'

export type OpSpec =
  /** All arguments share one type T, result is T. */
  | { kind: 'componentwise'; arity: number }
  /** All arguments share one type, result is a float. */
  | { kind: 'reduce'; arity: number }
  /** Fixed signature. */
  | { kind: 'fixed'; args: ValueType[]; result: ValueType }

export const OPS: Record<OpName, OpSpec> = {
  add: { kind: 'componentwise', arity: 2 },
  sub: { kind: 'componentwise', arity: 2 },
  mul: { kind: 'componentwise', arity: 2 },
  div: { kind: 'componentwise', arity: 2 },
  sin: { kind: 'componentwise', arity: 1 },
  cos: { kind: 'componentwise', arity: 1 },
  abs: { kind: 'componentwise', arity: 1 },
  fract: { kind: 'componentwise', arity: 1 },
  floor: { kind: 'componentwise', arity: 1 },
  min: { kind: 'componentwise', arity: 2 },
  max: { kind: 'componentwise', arity: 2 },
  pow: { kind: 'componentwise', arity: 2 },
  /** `x - y * floor(x / y)`: always has the sign of y, unlike a truncated remainder. */
  mod: { kind: 'componentwise', arity: 2 },
  clamp: { kind: 'componentwise', arity: 3 },
  mix: { kind: 'componentwise', arity: 3 },
  smoothstep: { kind: 'componentwise', arity: 3 },
  step: { kind: 'componentwise', arity: 2 },
  length: { kind: 'reduce', arity: 1 },
  noise: { kind: 'fixed', args: ['vec2'], result: 'float' },
}
