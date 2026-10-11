import { describe, expect, it } from 'vitest'
import {
  compileGraph,
  generateCode,
  generateCodeLines,
  generateGLSL,
  generateHLSL,
  generateWGSL,
} from './index'
import { build } from './testUtils'

describe('other backends', () => {
  function gradient() {
    const g = build()
    const uv = g.node('uv')
    const split = g.node('split')
    const time = g.node('time')
    const add = g.node('add')
    const noiseNode = g.node('noise')
    const mix = g.node('mix')
    const out = g.node('output')
    g.wire(uv, 'uv', split, 'value')
    g.wire(split, 'x', add, 'a')
    g.wire(time, 'time', add, 'b')
    g.wire(uv, 'uv', noiseNode, 'position')
    g.wire(add, 'result', mix, 't')
    g.wire(noiseNode, 'result', mix, 'a')
    g.wire(mix, 'result', out, 'color')
    const result = compileGraph(g.graph)
    if (!result.ok) throw new Error('compile failed')
    return result.ir
  }

  it('prints WGSL with the same variable names as GLSL', () => {
    const code = generateWGSL(gradient())
    expect(code).toContain('@fragment')
    expect(code).toContain('let x_1: f32 = uv.x;')
    expect(code).toContain('let add_1: f32 = x_1 + uniforms.time;')
    expect(code).toContain('fn sf_noise(p: vec2<f32>) -> f32')
    expect(code).toContain('return vec4<f32>(')
    expect(code).not.toMatch(/\bvec3\(/) // always vec3<f32>
  })

  it('prints HLSL with its own builtins', () => {
    const code = generateHLSL(gradient())
    expect(code).toContain('float x_1 = uv.x;')
    expect(code).toContain('lerp(')
    expect(code).not.toContain('mix(')
    expect(code).toContain('float4 main(')
  })

  it('generateCode dispatches on the language', () => {
    const ir = gradient()
    expect(generateCode(ir, 'glsl')).toBe(generateGLSL(ir))
    expect(generateCode(ir, 'wgsl')).toBe(generateWGSL(ir))
  })
})

describe('code ↔ node links', () => {
  it('tells which node produced each line, in every language', () => {
    const g = build()
    const uv = g.node('uv')
    const split = g.node('split')
    const sin = g.node('sin')
    const out = g.node('output')
    g.wire(uv, 'uv', split, 'value')
    g.wire(split, 'x', sin, 'x')
    g.wire(sin, 'result', out, 'color')
    const result = compileGraph(g.graph)
    if (!result.ok) throw new Error('compile failed')

    for (const language of ['glsl', 'wgsl', 'hlsl'] as const) {
      const lines = generateCodeLines(result.ir, language)
      expect(lines.map((l) => l.text).join('\n')).toBe(generateCode(result.ir, language))
      const sinLine = lines.find((l) => l.text.includes('sin('))
      expect(sinLine?.nodeId).toBe(sin)
      // the shader inputs and the final color are linked to their nodes too
      expect(lines.find((l) => /\buv\b\s*=/.test(l.text) && !l.text.includes('x_'))?.nodeId).toBe(uv)
      expect(lines.find((l) => /return|fragColor =/.test(l.text) && l.text.includes('1.0)'))?.nodeId).toBe(out)
      // the rest of the skeleton belongs to no node
      expect(lines.find((l) => l.text.includes('main'))?.nodeId).toBeUndefined()
    }
  })

  it('links the time uniform to the Time node', () => {
    const g = build()
    const time = g.node('time')
    const sin = g.node('sin')
    const out = g.node('output')
    g.wire(time, 'time', sin, 'x')
    g.wire(sin, 'result', out, 'color')
    const result = compileGraph(g.graph)
    if (!result.ok) throw new Error('compile failed')
    const lines = generateCodeLines(result.ir, 'glsl')
    expect(lines.find((l) => l.text === 'uniform float u_time;')?.nodeId).toBe(time)
  })
})
