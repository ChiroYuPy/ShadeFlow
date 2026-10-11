import type { IRInputName, IRInstr, IRModule, ValueId } from '../ir/ir'
import type { OpName } from '../ir/ops'
import type { ValueType } from '../types'

/**
 * Language-independent code emission. A backend is just a `Target`: names,
 * operators and the program skeleton. Everything else — variable naming, which
 * instructions are inlined, which helpers are needed — is shared.
 */

/** How an op is written: `a + b`, `name(a, b)`, or a custom expression of the argument strings. */
type OpSyntax = { infix: string } | { call: string } | { expr: (args: string[]) => string }

interface Program {
  usedInputs: ReadonlySet<IRInputName>
  usedOps: ReadonlySet<OpName>
  /** Declarations of the intermediate values, one per line (already indented). */
  body: string[]
  /** Expression of the final color (a vec3). */
  result: string
  /**
   * Returns a program line unchanged, linking it to the node behind a shader input
   * (or the Output node) so the code panel can highlight it.
   */
  mark(line: string, key: IRInputName | 'output'): string
}

export interface Target {
  /** Name of a vector/scalar type, e.g. `vec3`, `vec3<f32>`, `float3`. */
  typeName(type: ValueType): string
  /** `return`-free declaration of a value, indentation included. */
  declare(type: ValueType, name: string, expression: string): string
  ops: Record<OpName, OpSyntax>
  /** Expression reading a shader input. */
  input(name: IRInputName): string
  program(p: Program): string
}

function literal(n: number): string {
  const s = Number.isInteger(n) ? n.toFixed(1) : String(n)
  return n < 0 ? `(${s})` : s
}

/** Generated code, and which graph node each declaration line comes from. */
export interface Emitted {
  code: string
  /** Declaration line (exact text) → id of the node that produced it. */
  origins: ReadonlyMap<string, string>
}

export function emit(ir: IRModule, target: Target): Emitted {
  const names = new Map<ValueId, string>()
  const counters = new Map<string, number>()
  const body: string[] = []
  const origins = new Map<string, string>()
  const inputOrigins = new Map<IRInputName, string>()
  for (const instr of ir.instructions) {
    if (instr.expr.kind === 'input' && instr.origin !== undefined && !inputOrigins.has(instr.expr.name)) {
      inputOrigins.set(instr.expr.name, instr.origin)
    }
  }
  const mark = (line: string, key: IRInputName | 'output') => {
    const origin = key === 'output' ? ir.resultOrigin : inputOrigins.get(key)
    if (origin !== undefined) origins.set(line, origin)
    return line
  }
  const usedInputs = new Set<IRInputName>()
  const usedOps = new Set<OpName>()
  const ref = (id: ValueId) => names.get(id)!

  function expression(instr: IRInstr): string {
    const e = instr.expr
    switch (e.kind) {
      case 'const': {
        if (e.value.length === 1) return literal(e.value[0])
        const same = e.value.every((v) => v === e.value[0])
        return `${target.typeName(instr.type)}(${(same ? [e.value[0]] : e.value).map(literal).join(', ')})`
      }
      case 'input':
        usedInputs.add(e.name)
        return target.input(e.name)
      case 'construct':
        return `${target.typeName(instr.type)}(${e.args.map(ref).join(', ')})`
      case 'swizzle':
        return `${ref(e.arg)}.${e.components}`
      case 'op': {
        usedOps.add(e.op)
        const syntax = target.ops[e.op]
        const args = e.args.map(ref)
        if ('infix' in syntax) return `${args[0]} ${syntax.infix} ${args[1]}`
        if ('expr' in syntax) return syntax.expr(args)
        return `${syntax.call}(${args.join(', ')})`
      }
    }
  }

  function baseName(instr: IRInstr): string {
    const e = instr.expr
    if (e.kind === 'op') return e.op
    if (e.kind === 'construct') return instr.type
    if (e.kind === 'swizzle') return e.components
    return 'value'
  }

  for (const instr of ir.instructions) {
    const text = expression(instr)
    // Constants and inputs are inlined; everything else gets its own line,
    // named after its operation so the code reads like the graph.
    if (instr.expr.kind === 'const' || instr.expr.kind === 'input') {
      names.set(instr.id, text)
      continue
    }
    const base = baseName(instr)
    const n = (counters.get(base) ?? 0) + 1
    counters.set(base, n)
    const name = `${base}_${n}`
    names.set(instr.id, name)
    const line = target.declare(instr.type, name, text)
    body.push(line)
    if (instr.origin !== undefined) origins.set(line, instr.origin)
  }

  return { code: target.program({ usedInputs, usedOps, body, result: ref(ir.result), mark }), origins }
}
