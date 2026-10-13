import type { IRBuilder } from '../ir/builder'
import type { ValueId } from '../ir/ir'
import type { GraphNode } from '../graph'
import type { PortType, ValueType } from '../types'

export type NodeCategory =
  | 'input'
  | 'math'
  | 'trigonometry'
  | 'round'
  | 'range'
  | 'interpolation'
  | 'vector'
  | 'uv'
  | 'procedural'
  | 'color'
  | 'output'

export interface InputPortDef {
  name: string
  label: string
  type: PortType
  /**
   * Value used when the port has no wire. A single number is splatted to vectors.
   * `'uv'`: the pixel's UV instead of a value to edit (positions: the node works on its own).
   */
  default: number[] | 'uv'
  /** `false` = a plain parameter shown on the node, no handle to wire. */
  connectable?: boolean
  /** Hint for the UI on how to edit the value. */
  widget?: 'color'
  /** The value is a whole number within these bounds (a count the compiler unrolls). */
  whole?: { min: number; max: number }
}

interface OutputPortDef {
  name: string
  label: string
  type: PortType
}

interface LowerContext {
  b: IRBuilder
  node: GraphNode
  /** Resolved type of the node's `gen` ports (float when nothing drives them). */
  type: ValueType
  /** Every input, already converted to its resolved type. */
  inputs: Record<string, ValueId>
}

export interface NodeDef {
  type: string
  label: string
  /** One or two sentences explaining what the node does (shown in the UI). */
  description: string
  category: NodeCategory
  inputs: InputPortDef[]
  outputs: OutputPortDef[]
  /** `none`: the node never shows a preview (its own editor already shows the value). */
  preview?: 'none'
  /**
   * Emit IR. May omit outputs that are unavailable for the current inputs
   * (e.g. `z` of a Split fed with a vec2) — wiring them is then an error.
   */
  lower(ctx: LowerContext): Record<string, ValueId>
}
