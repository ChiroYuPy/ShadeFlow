import type { ValueType } from '../types'
import type { OpName } from './ops'

/**
 * Intermediate representation: a flat, typed, SSA-like list of instructions.
 * Backends (GLSL, WGSL, HLSL…) only know this — never the node graph.
 *
 * Invariants guaranteed by `IRBuilder`:
 *  - instructions are in dependency order (arguments come first);
 *  - componentwise ops have all arguments of the same type (no implicit
 *    broadcasting inside the IR: conversions are explicit `construct`s).
 */

export type ValueId = number

export type IRInputName = 'uv' | 'time' | 'resolution' | 'mouse'

export const IR_INPUT_TYPES: Record<IRInputName, ValueType> = {
  uv: 'vec2',
  time: 'float',
  resolution: 'vec2',
  mouse: 'vec2',
}

export type IRExpr =
  | { kind: 'const'; value: number[] }
  | { kind: 'input'; name: IRInputName }
  | { kind: 'op'; op: OpName; args: ValueId[] }
  /** Build a vector from floats, or splat a single float. */
  | { kind: 'construct'; args: ValueId[] }
  | { kind: 'swizzle'; arg: ValueId; components: string }

export interface IRInstr {
  id: ValueId
  type: ValueType
  expr: IRExpr
  /** Graph node that produced this instruction (for code ↔ node highlighting). */
  origin?: string
}

export interface IRModule {
  instructions: IRInstr[]
  /** The final color (always a vec3). */
  result: ValueId
  /** The Output node the result comes from, when compiling the whole graph. */
  resultOrigin?: string
}
