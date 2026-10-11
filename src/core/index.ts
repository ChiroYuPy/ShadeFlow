import type { Emitted } from './codegen/emit'
import { emitGLSL, generateGLSL } from './codegen/glsl'
import { emitHLSL } from './codegen/hlsl'
import { emitWGSL } from './codegen/wgsl'
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

function emitCode(ir: IRModule, language: ShaderLanguage): Emitted {
  switch (language) {
    case 'glsl':
      return emitGLSL(ir)
    case 'wgsl':
      return emitWGSL(ir)
    case 'hlsl':
      return emitHLSL(ir)
  }
}

/** Print an IR module in the given shading language. */
export function generateCode(ir: IRModule, language: ShaderLanguage): string {
  return emitCode(ir, language).code
}

/** The code split in lines, each with the id of the graph node that produced it (if any). */
export function generateCodeLines(ir: IRModule, language: ShaderLanguage): { text: string; nodeId?: string }[] {
  const { code, origins } = emitCode(ir, language)
  return code.split('\n').map((text) => ({ text, nodeId: origins.get(text) }))
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
