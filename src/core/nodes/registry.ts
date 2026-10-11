import { BUILTIN_NODES } from './builtin'
import type { NodeDef } from './definition'

const byType = new Map<string, NodeDef>(BUILTIN_NODES.map((d) => [d.type, d]))

export function getNodeDef(type: string): NodeDef | undefined {
  return byType.get(type)
}

export function listNodeDefs(): NodeDef[] {
  return BUILTIN_NODES
}
