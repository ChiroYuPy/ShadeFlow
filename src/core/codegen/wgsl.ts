import type { IRModule } from '../ir/ir'
import type { ValueType } from '../types'
import { emit, type Target } from './emit'

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

const NOISE = `fn sf_hash(p: vec2<f32>) -> f32 {
  let q = vec2<u32>(vec2<i32>(p)) * vec2<u32>(1597334673u, 3812015801u);
  var n = q.x ^ q.y;
  n = (n ^ (n >> 16u)) * 2246822519u;
  return f32(n >> 8u) / 16777216.0;
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

const RANDOM = `fn sf_random(seed: vec2<f32>) -> f32 {
  let q = bitcast<vec2<u32>>(seed) * vec2<u32>(1597334673u, 3812015801u);
  var n = q.x ^ q.y;
  n = (n ^ (n >> 16u)) * 2246822519u;
  return f32(n >> 8u) / 16777216.0;
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
    atan2: { call: 'atan2' },
    abs: { call: 'abs' },
    fract: { call: 'fract' },
    floor: { call: 'floor' },
    ceil: { call: 'ceil' },
    sqrt: { call: 'sqrt' },
    sign: { call: 'sign' },
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
    random: { call: 'sf_random' },
  },
  input: (name) => ({ uv: 'uv', time: 'uniforms.time', resolution: 'uniforms.resolution', mouse: 'uniforms.mouse' })[name],
  program: ({ usedInputs, usedOps, body, result }) =>
    [
      'struct Uniforms {',
      '  resolution: vec2<f32>,',
      '  time: f32,',
      ...(usedInputs.has('mouse') ? ['  mouse: vec2<f32>,'] : []),
      '}',
      '',
      '@group(0) @binding(0) var<uniform> uniforms: Uniforms;',
      '',
      ...(usedOps.has('noise') ? [NOISE, ''] : []),
      ...(usedOps.has('random') ? [RANDOM, ''] : []),
      '@fragment',
      'fn fs_main(@builtin(position) frag_coord: vec4<f32>) -> @location(0) vec4<f32> {',
      '  // WGSL pixel coordinates start at the top-left: flip Y so uv matches GLSL.',
      '  let uv = vec2<f32>(frag_coord.x, uniforms.resolution.y - frag_coord.y) / uniforms.resolution;',
      ...body,
      `  return vec4<f32>(${result}, 1.0);`,
      '}',
      '',
    ].join('\n'),
}

export const generateWGSL = (ir: IRModule): string => emit(ir, wgsl)
