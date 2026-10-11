import type { IRInputName, IRModule, ValueType } from '@/core'

/**
 * What a node preview shows:
 * - `image`: the value changes across the screen, so it is drawn as a picture;
 * - `value`: it is the same everywhere (time, constants…), so a picture would be a flat
 *   rectangle — the number itself is shown instead;
 * - `none`: nothing to show (the node cannot be compiled).
 */
export type PreviewKind = 'image' | 'value' | 'none'

/** Does computing this IR read the given shader input? */
export function usesInput(ir: IRModule, name: IRInputName): boolean {
  return ir.instructions.some((i) => i.expr.kind === 'input' && i.expr.name === name)
}

export function previewKindOf(ir: IRModule): Exclude<PreviewKind, 'none'> {
  return usesInput(ir, 'uv') ? 'image' : 'value'
}

const round = (n: number) => {
  const r = Math.round(n * 1000) / 1000
  return String(Object.is(r, -0) ? 0 : r)
}

const toByte = (n: number) => Math.round(Math.min(1, Math.max(0, n)) * 255)

/**
 * Text for a computed value. `rgb` is the vec3 the compiler produces for display:
 * a float is repeated on every channel, a vec2 is padded with 0.
 */
export function describeValue(type: ValueType, rgb: number[]): { text: string; swatch: string | null } {
  switch (type) {
    case 'float':
      return { text: round(rgb[0]), swatch: null }
    case 'vec2':
      return { text: `${round(rgb[0])}, ${round(rgb[1])}`, swatch: null }
    default:
      return {
        text: rgb.slice(0, 3).map(round).join(', '),
        swatch: `rgb(${toByte(rgb[0])} ${toByte(rgb[1])} ${toByte(rgb[2])})`,
      }
  }
}
