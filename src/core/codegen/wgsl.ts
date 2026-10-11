import type { IRModule } from '../ir/ir'
import type { ValueType } from '../types'
import { emit, type Emitted, type Target } from './emit'

/**
 * WGSL (WebGPU) backend. Mirrors the GLSL output so both can be read side by
 * side: same variable names, same structure.
 */

const TYPES: Record<ValueType, string> = {
  float: 'f32',
  vec2: 'vec2<f32>',
  vec3: 'vec3<f32>',
  vec4: 'vec4<f32>',
}

const NOISE = `fn sf_hash(p_in: vec2<f32>) -> f32 {
  var p = fract(p_in * vec2<f32>(123.34, 456.21));
  p = p + dot(p, p + 45.32);
  return fract(p.x * p.y);
}

fn sf_noise(p: vec2<f32>) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let s = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(
    mix(sf_hash(i), sf_hash(i + vec2<f32>(1.0, 0.0)), s.x),
    mix(sf_hash(i + vec2<f32>(0.0, 1.0)), sf_hash(i + vec2<f32>(1.0, 1.0)), s.x),
    s.y
  );
}`

const wgsl: Target = {
  typeName: (t) => TYPES[t],
  declare: (type, name, expr) => `  let ${name}: ${TYPES[type]} = ${expr};`,
  ops: {
    add: { infix: '+' },
    sub: { infix: '-' },
    mul: { infix: '*' },
    div: { infix: '/' },
    sin: { call: 'sin' },
    cos: { call: 'cos' },
    abs: { call: 'abs' },
    fract: { call: 'fract' },
    floor: { call: 'floor' },
    min: { call: 'min' },
    max: { call: 'max' },
    pow: { call: 'pow' },
    mod: { expr: ([x, y]) => `${x} - ${y} * floor(${x} / ${y})` },
    clamp: { call: 'clamp' },
    mix: { call: 'mix' },
    smoothstep: { call: 'smoothstep' },
    step: { call: 'step' },
    length: { call: 'length' },
    noise: { call: 'sf_noise' },
  },
  input: (name) => ({ uv: 'uv', time: 'uniforms.time', resolution: 'uniforms.resolution' })[name],
  program: ({ usedOps, body, result, mark }) =>
    [
      'struct Uniforms {',
      mark('  resolution: vec2<f32>,', 'resolution'),
      mark('  time: f32,', 'time'),
      '}',
      '',
      '@group(0) @binding(0) var<uniform> uniforms: Uniforms;',
      '',
      ...(usedOps.has('noise') ? [NOISE, ''] : []),
      '@fragment',
      'fn fs_main(@builtin(position) frag_coord: vec4<f32>) -> @location(0) vec4<f32> {',
      '  // WGSL pixel coordinates start at the top-left: flip Y so uv matches GLSL.',
      mark('  let uv = vec2<f32>(frag_coord.x, uniforms.resolution.y - frag_coord.y) / uniforms.resolution;', 'uv'),
      ...body,
      mark(`  return vec4<f32>(${result}, 1.0);`, 'output'),
      '}',
      '',
    ].join('\n'),
}

export const emitWGSL = (ir: IRModule): Emitted => emit(ir, wgsl)

export const generateWGSL = (ir: IRModule): string => emitWGSL(ir).code
