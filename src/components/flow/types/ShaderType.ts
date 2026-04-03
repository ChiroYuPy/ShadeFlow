export const ShaderType = {
  Float: 'float',
  Vec2: 'vec2',
  Vec3: 'vec3',
  Vec4: 'vec4',
} as const;

export type ShaderType = (typeof ShaderType)[keyof typeof ShaderType];

// Rank of each type in the hierarchy (higher = wider type)
const TYPE_RANK: Record<ShaderType, number> = {
  [ShaderType.Float]: 0,
  [ShaderType.Vec2]: 1,
  [ShaderType.Vec3]: 2,
  [ShaderType.Vec4]: 3,
};

export const COMPONENT_COUNT: Record<ShaderType, number> = {
  [ShaderType.Float]: 1,
  [ShaderType.Vec2]: 2,
  [ShaderType.Vec3]: 3,
  [ShaderType.Vec4]: 4,
};

/**
 * Check if implicit conversion is possible
 * float -> vec2 -> vec3 -> vec4 (always allowed in this direction)
 */
export function canConvert(from: ShaderType, to: ShaderType): boolean {
  return TYPE_RANK[from] <= TYPE_RANK[to];
}

/**
 * Returns the common widest type for a binary operation
 * Ex: float + vec3 => vec3, vec2 + vec4 => vec4
 */
export function getCommonType(a: ShaderType, b: ShaderType): ShaderType {
  return TYPE_RANK[a] >= TYPE_RANK[b] ? a : b;
}

/**
 * Returns the widest type from a list
 */
export function getWidestType(...types: ShaderType[]): ShaderType {
  return types.reduce((widest, current) =>
    TYPE_RANK[current] >= TYPE_RANK[widest] ? current : widest
  );
}

/**
 * Parse a type from a string (for handles)
 */
export function parseShaderType(str: string): ShaderType | null {
  const values: ShaderType[] = Object.values(ShaderType);
  if (values.includes(str as ShaderType)) {
    return str as ShaderType;
  }
  return null;
}

/**
 * Extract type from a handle ID
 * Expected format: "{type}-{direction}" or "{type}-output"
 * Ex: "float-output", "vec2-input-1"
 */
export function getTypeFromHandleId(handleId: string): ShaderType | null {
  const prefix = handleId.split('-')[0];
  return parseShaderType(prefix);
}
