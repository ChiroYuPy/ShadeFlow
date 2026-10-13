import type { IRModule } from '../ir/ir'
import { emit, type Emitted, type Target } from './emit'

/** GLSL ES 3.00 (WebGL2) backend. */

// The hash works on integers: integer math is exact, so every GPU gives the same
// noise (a float hash rounds differently from one GPU to the next, mobile ones especially).
const NOISE = `float sf_hash(vec2 p) {
  uvec2 q = uvec2(ivec2(p)) * uvec2(1597334673u, 3812015801u);
  uint n = q.x ^ q.y;
  n = (n ^ (n >> 16)) * 2246822519u;
  return float(n >> 8) / 16777216.0;
}

float sf_noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(
    mix(sf_hash(i), sf_hash(i + vec2(1.0, 0.0)), u.x),
    mix(sf_hash(i + vec2(0.0, 1.0)), sf_hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}`

const glsl: Target = {
  typeName: (t) => t,
  declare: (type, name, expr) => `  ${type} ${name} = ${expr};`,
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
    mod: { call: 'mod' },
    clamp: { call: 'clamp' },
    mix: { call: 'mix' },
    smoothstep: { call: 'smoothstep' },
    step: { call: 'step' },
    length: { call: 'length' },
    noise: { call: 'sf_noise' },
  },
  input: (name) => ({ uv: 'uv', time: 'u_time', resolution: 'u_resolution' })[name],
  program: ({ usedInputs, usedOps, body, result, mark }) =>
    [
      '#version 300 es',
      'precision highp float;',
      // Integers default to mediump (often 16 bits on phones): the hash needs all 32.
      ...(usedOps.has('noise') ? ['precision highp int;'] : []),
      '',
      mark('uniform vec2 u_resolution;', 'resolution'),
      ...(usedInputs.has('time') ? [mark('uniform float u_time;', 'time')] : []),
      '',
      'out vec4 fragColor;',
      '',
      ...(usedOps.has('noise') ? [NOISE, ''] : []),
      'void main() {',
      mark('  vec2 uv = gl_FragCoord.xy / u_resolution;', 'uv'),
      ...body,
      mark(`  fragColor = vec4(${result}, 1.0);`, 'output'),
      '}',
      '',
    ].join('\n'),
}

export const emitGLSL = (ir: IRModule): Emitted => emit(ir, glsl)

export const generateGLSL = (ir: IRModule): string => emitGLSL(ir).code
