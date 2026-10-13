import type { IRModule } from '../ir/ir'
import type { ValueType } from '../types'
import { emit, type Emitted, type Target } from './emit'

/** HLSL (Direct3D) pixel shader backend. Display/export only: nothing runs it in the browser. */

const TYPES: Record<ValueType, string> = {
  float: 'float',
  vec2: 'float2',
  vec3: 'float3',
  vec4: 'float4',
}

const NOISE = `float sf_hash(float2 p) {
  uint2 q = uint2(int2(p)) * uint2(1597334673u, 3812015801u);
  uint n = q.x ^ q.y;
  n = (n ^ (n >> 16)) * 2246822519u;
  return float(n >> 8) / 16777216.0;
}

float sf_noise(float2 p) {
  float2 i = floor(p);
  float2 f = frac(p);
  float2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return lerp(
    lerp(sf_hash(i), sf_hash(i + float2(1.0, 0.0)), u.x),
    lerp(sf_hash(i + float2(0.0, 1.0)), sf_hash(i + float2(1.0, 1.0)), u.x),
    u.y
  );
}`

const RANDOM = `float sf_random(float2 seed) {
  uint2 q = asuint(seed) * uint2(1597334673u, 3812015801u);
  uint n = q.x ^ q.y;
  n = (n ^ (n >> 16)) * 2246822519u;
  return float(n >> 8) / 16777216.0;
}`

const hlsl: Target = {
  typeName: (t) => TYPES[t],
  declare: (type, name, expr) => `  ${TYPES[type]} ${name} = ${expr};`,
  ops: {
    add: { infix: '+' },
    sub: { infix: '-' },
    mul: { infix: '*' },
    div: { infix: '/' },
    sin: { call: 'sin' },
    cos: { call: 'cos' },
    atan2: { call: 'atan2' },
    abs: { call: 'abs' },
    fract: { call: 'frac' },
    floor: { call: 'floor' },
    min: { call: 'min' },
    max: { call: 'max' },
    pow: { call: 'pow' },
    mod: { expr: ([x, y]) => `${x} - ${y} * floor(${x} / ${y})` },
    clamp: { call: 'clamp' },
    mix: { call: 'lerp' },
    smoothstep: { call: 'smoothstep' },
    step: { call: 'step' },
    length: { call: 'length' },
    noise: { call: 'sf_noise' },
    random: { call: 'sf_random' },
  },
  input: (name) => ({ uv: 'uv', time: 'time', resolution: 'resolution', mouse: 'mouse' })[name],
  program: ({ usedInputs, usedOps, body, result, mark }) =>
    [
      'cbuffer Uniforms : register(b0) {',
      mark('  float2 resolution;', 'resolution'),
      mark('  float time;', 'time'),
      ...(usedInputs.has('mouse') ? [mark('  float2 mouse;', 'mouse')] : []),
      '};',
      '',
      ...(usedOps.has('noise') ? [NOISE, ''] : []),
      ...(usedOps.has('random') ? [RANDOM, ''] : []),
      'float4 main(float4 position : SV_Position) : SV_Target {',
      '  // HLSL pixel coordinates start at the top-left: flip Y so uv matches GLSL.',
      mark('  float2 uv = float2(position.x, resolution.y - position.y) / resolution;', 'uv'),
      ...body,
      mark(`  return float4(${result}, 1.0);`, 'output'),
      '}',
      '',
    ].join('\n'),
}

export const emitHLSL = (ir: IRModule): Emitted => emit(ir, hlsl)

export const generateHLSL = (ir: IRModule): string => emitHLSL(ir).code
