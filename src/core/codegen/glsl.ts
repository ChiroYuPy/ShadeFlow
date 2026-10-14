import type { IRModule } from '../ir/ir'
import { emit, type Target } from './emit'

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

// Same hash, fed with the bits of the seed so that any two different seeds differ.
const RANDOM = `float sf_random(vec2 seed) {
  uvec2 q = floatBitsToUint(seed) * uvec2(1597334673u, 3812015801u);
  uint n = q.x ^ q.y;
  n = (n ^ (n >> 16)) * 2246822519u;
  return float(n >> 8) / 16777216.0;
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
    atan2: { call: 'atan' },
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
    random: { call: 'sf_random' },
  },
  input: (name) => ({ uv: 'uv', time: 'u_time', resolution: 'u_resolution', mouse: 'u_mouse' })[name],
  program: ({ usedInputs, usedOps, body, result }) =>
    [
      '#version 300 es',
      'precision highp float;',
      // Integers default to mediump (often 16 bits on phones): the hash needs all 32.
      ...(usedOps.has('noise') || usedOps.has('random') ? ['precision highp int;'] : []),
      '',
      'uniform vec2 u_resolution;',
      ...(usedInputs.has('time') ? ['uniform float u_time;'] : []),
      ...(usedInputs.has('mouse') ? ['uniform vec2 u_mouse;'] : []),
      '',
      'out vec4 fragColor;',
      '',
      ...(usedOps.has('noise') ? [NOISE, ''] : []),
      ...(usedOps.has('random') ? [RANDOM, ''] : []),
      'void main() {',
      '  vec2 uv = gl_FragCoord.xy / u_resolution;',
      ...body,
      `  fragColor = vec4(${result}, 1.0);`,
      '}',
      '',
    ].join('\n'),
}

export const generateGLSL = (ir: IRModule): string => emit(ir, glsl)
