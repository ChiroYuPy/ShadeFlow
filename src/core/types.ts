/** Value types a wire can carry. */
export type ValueType = 'float' | 'vec2' | 'vec3' | 'vec4'

/**
 * Type of a node port. `gen` is a "generic" port: it adapts to the widest
 * vector type connected to the node (all `gen` ports of a node share it).
 */
export type PortType = ValueType | 'gen'

export const componentCount: Record<ValueType, number> = {
  float: 1,
  vec2: 2,
  vec3: 3,
  vec4: 4,
}

/** Implicit conversions: same type, or a float broadcast to a vector (1 → (1, 1, 1)). */
export function canConvert(from: ValueType, to: ValueType): boolean {
  return from === to || from === 'float'
}
