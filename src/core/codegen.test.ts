import { describe, expect, it } from 'vitest'
import {
  compileGraph,
  generateCode,
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
