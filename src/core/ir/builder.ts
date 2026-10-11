import { componentCount, type ValueType } from '../types'
import { IR_INPUT_TYPES, type IRExpr, type IRInputName, type IRInstr, type IRModule, type ValueId } from './ir'
import { OPS, type OpName } from './ops'

/**
 * Builds IR with hash-consing: identical expressions are created once
 * (so two `sin(time)` nodes share one instruction).
 */
export class IRBuilder {
  /** Graph node id recorded on newly created instructions. */
  origin: string | undefined

  private instrs: IRInstr[] = []
  private cache = new Map<string, ValueId>()

  typeOf(id: ValueId): ValueType {
    return this.instrs[id].type
  }

  constant(type: ValueType, value: number[]): ValueId {
    if (value.length !== componentCount[type]) {
      throw new Error(`constant ${type} needs ${componentCount[type]} values, got ${value.length}`)
    }
    return this.emit(type, { kind: 'const', value })
  }

  input(name: IRInputName): ValueId {
    return this.emit(IR_INPUT_TYPES[name], { kind: 'input', name })
  }

  op(op: OpName, args: ValueId[]): ValueId {
    const spec = OPS[op]
    const types = args.map((a) => this.typeOf(a))
    let result: ValueType
    if (spec.kind === 'fixed') {
      if (args.length !== spec.args.length || types.some((t, i) => t !== spec.args[i])) {
        throw new Error(`${op} expects (${spec.args.join(', ')}), got (${types.join(', ')})`)
      }
      result = spec.result
    } else {
      if (args.length !== spec.arity || types.some((t) => t !== types[0])) {
        throw new Error(`${op} expects ${spec.arity} argument(s) of the same type, got (${types.join(', ')})`)
      }
      result = spec.kind === 'reduce' ? 'float' : types[0]
    }
    return this.emit(result, { kind: 'op', op, args })
  }

  /** `vecN(a, b, …)` from floats, or `vecN(a)` splat from a single float. */
  construct(type: ValueType, args: ValueId[]): ValueId {
    const n = componentCount[type]
    if (args.length !== n && args.length !== 1) {
      throw new Error(`${type} needs ${n} floats (or 1 to splat), got ${args.length}`)
    }
    if (args.some((a) => this.typeOf(a) !== 'float')) {
      throw new Error(`${type} can only be built from floats`)
    }
    const consts = args.map((a) => this.instrs[a].expr)
    if (consts.every((e) => e.kind === 'const')) {
      const values = consts.map((e) => (e as { value: number[] }).value[0])
      return this.constant(type, args.length === 1 ? Array(n).fill(values[0]) : values)
    }
    return this.emit(type, { kind: 'construct', args })
  }

  swizzle(arg: ValueId, components: string): ValueId {
    const from = this.typeOf(arg)
    const letters = 'xyzw'.slice(0, componentCount[from])
    if (components.length < 1 || components.length > 4 || [...components].some((c) => !letters.includes(c))) {
      throw new Error(`cannot swizzle ${from} with .${components}`)
    }
    if (components.length === 1 && from === 'float') return arg
    const type = (['float', 'vec2', 'vec3', 'vec4'] as const)[components.length - 1]
    return this.emit(type, { kind: 'swizzle', arg, components })
  }

  /** Apply an implicit conversion (float → vecN). Throws if not allowed. */
  convert(id: ValueId, to: ValueType): ValueId {
    const from = this.typeOf(id)
    if (from === to) return id
    if (from !== 'float') throw new Error(`cannot convert ${from} to ${to}`)
    return this.construct(to, [id])
  }

  /** Drop instructions not needed to compute `result`, and return the module. */
  finish(result: ValueId, resultOrigin?: string): IRModule {
    const live = new Set<ValueId>([result])
    for (let i = this.instrs.length - 1; i >= 0; i--) {
      if (!live.has(i)) continue
      const e = this.instrs[i].expr
      if (e.kind === 'op' || e.kind === 'construct') e.args.forEach((a) => live.add(a))
      else if (e.kind === 'swizzle') live.add(e.arg)
    }
    return { instructions: this.instrs.filter((i) => live.has(i.id)), result, resultOrigin }
  }

  private emit(type: ValueType, expr: IRExpr): ValueId {
    const key = type + JSON.stringify(expr)
    const hit = this.cache.get(key)
    if (hit !== undefined) return hit
    const id = this.instrs.length
    this.instrs.push({ id, type, expr, origin: this.origin })
    this.cache.set(key, id)
    return id
  }
}
