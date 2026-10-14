import { generateGLSL } from './codegen/glsl'
import { generateHLSL } from './codegen/hlsl'
import { generateWGSL } from './codegen/wgsl'
import type { IRModule } from './ir/ir'
import { compileGraph, type CompileOptions, type Diagnostic } from './compile/lower'
import type { Graph } from './graph'

export type { CompileOptions } from './compile/lower'
export { compileGraph } from './compile/lower'
export { generateGLSL } from './codegen/glsl'
export { generateHLSL } from './codegen/hlsl'
export { generateWGSL } from './codegen/wgsl'
export { getNodeDef, listNodeDefs } from './nodes/registry'
export type { NodeDef, NodeCategory } from './nodes/definition'
export type { Graph, GraphNode, GraphEdge, PortRef } from './graph'
export { newId } from './id'
export { newGraph, NOTE_TYPE, sameShader } from './graph'
export { coerceConstant } from './compile/lower'
export { parseProject, serializeProject } from './project'
export type { IRInputName, IRModule } from './ir/ir'
export * from './types'

export type ShaderResult = { ok: true; code: string } | { ok: false; diagnostics: Diagnostic[] }

/** Graph → GLSL ES 3.00 fragment shader source. */
export function compileToGLSL(graph: Graph, options?: CompileOptions): ShaderResult {
  const result = compileGraph(graph, options)
  return result.ok ? { ok: true, code: generateGLSL(result.ir) } : result
}
export { canConnect, compatiblePort, concreteType, resolveGenTypes, type WireAnchor } from './typing'

export const SHADER_LANGUAGES = ['glsl', 'wgsl', 'hlsl'] as const
export type ShaderLanguage = (typeof SHADER_LANGUAGES)[number]

/** Print an IR module in the given shading language. */
export function generateCode(ir: IRModule, language: ShaderLanguage): string {
  switch (language) {
    case 'glsl':
      return generateGLSL(ir)
    case 'wgsl':
      return generateWGSL(ir)
    case 'hlsl':
      return generateHLSL(ir)
  }
}
export {
  extractFragment,
  freeOffset,
  instantiateFragment,
  parseFragment,
  serializeFragment,
  type GraphFragment,
} from './clipboard'
export { evaluate } from './evaluate'
