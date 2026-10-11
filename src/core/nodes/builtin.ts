import type { OpName } from '../ir/ops'
import type { InputPortDef, NodeCategory, NodeDef } from './definition'

const gen = (name: string, label: string, value: number): InputPortDef => ({
  name,
  label,
  type: 'gen',
  default: [value],
})

const float = (name: string, label: string, value: number, connectable = true): InputPortDef => ({
  name,
  label,
  type: 'float',
  default: [value],
  connectable,
})

/** A node applying one IR op to all its inputs, in order. */
function mathNode(
  type: string,
  label: string,
  description: string,
  op: OpName,
  inputs: InputPortDef[],
  outputType: 'gen' | 'float' = 'gen',
  category: NodeCategory = 'math',
): NodeDef {
  return {
    type,
    label,
    description,
    category,
    inputs,
    outputs: [{ name: 'result', label: 'Result', type: outputType }],
    lower: ({ b, inputs: v }) => ({ result: b.op(op, inputs.map((p) => v[p.name])) }),
  }
}

const ab = (a: number, b: number) => [gen('a', 'A', a), gen('b', 'B', b)]
const x = (value = 0) => [gen('x', 'X', value)]

export const BUILTIN_NODES: NodeDef[] = [
  // ── Output ────────────────────────────────────────────────────────────
  {
    type: 'output',
    label: 'Output',
    description: 'The final color of each pixel. Every shader ends here.',
    category: 'output',
    inputs: [{ name: 'color', label: 'Color', type: 'vec3', default: [0, 0, 0], widget: 'color' }],
    outputs: [{ name: 'color', label: 'Color', type: 'vec3' }],
    lower: ({ inputs }) => ({ color: inputs.color }),
  },

  // ── Inputs ────────────────────────────────────────────────────────────
  {
    type: 'uv',
    label: 'UV',
    description:
      'Position of the pixel on the screen. (0, 0) is the bottom-left corner and (1, 1) the top-right corner.',
    category: 'input',
    inputs: [],
    outputs: [{ name: 'uv', label: 'UV', type: 'vec2' }],
    lower: ({ b }) => ({ uv: b.input('uv') }),
  },
  {
    type: 'time',
    label: 'Time',
    description: 'Seconds elapsed since the shader started. Use it to animate things.',
    category: 'input',
    inputs: [],
    outputs: [{ name: 'time', label: 'Time', type: 'float' }],
    lower: ({ b }) => ({ time: b.input('time') }),
  },

  {
    type: 'resolution',
    label: 'Resolution',
    description: 'Size of the drawing area in pixels (width, height).',
    category: 'input',
    inputs: [],
    outputs: [{ name: 'resolution', label: 'Resolution', type: 'vec2' }],
    lower: ({ b }) => ({ resolution: b.input('resolution') }),
  },
  {
    type: 'centered-uv',
    label: 'Centered UV',
    description:
      'Screen position with (0, 0) in the middle, corrected for the aspect ratio so circles stay round. Height goes from -0.5 to 0.5.',
    category: 'input',
    inputs: [],
    outputs: [{ name: 'uv', label: 'UV', type: 'vec2' }],
    lower: ({ b }) => {
      const resolution = b.input('resolution')
      const aspect = b.op('div', [b.swizzle(resolution, 'x'), b.swizzle(resolution, 'y')])
      const scale = b.construct('vec2', [aspect, b.constant('float', [1])])
      const centered = b.op('sub', [b.input('uv'), b.constant('vec2', [0.5, 0.5])])
      return { uv: b.op('mul', [centered, scale]) }
    },
  },

  // ── Constants ─────────────────────────────────────────────────────────
  {
    type: 'float',
    label: 'Float',
    description: 'A constant number.',
    category: 'constant',
    preview: 'none',
    inputs: [float('value', 'Value', 0, false)],
    outputs: [{ name: 'value', label: 'Value', type: 'float' }],
    lower: ({ inputs }) => ({ value: inputs.value }),
  },
  {
    type: 'color',
    label: 'Color',
    description: 'A constant color, stored as a vec3 of red, green and blue between 0 and 1.',
    category: 'constant',
    preview: 'none',
    inputs: [{ name: 'color', label: 'Color', type: 'vec3', default: [1, 1, 1], connectable: false, widget: 'color' }],
    outputs: [{ name: 'color', label: 'Color', type: 'vec3' }],
    lower: ({ inputs }) => ({ color: inputs.color }),
  },

  // ── Vectors ───────────────────────────────────────────────────────────
  {
    type: 'vec2',
    label: 'Vec2',
    description: 'Packs two numbers into a vec2. A vec2 is a pair of values, like a 2D position.',
    category: 'vector',
    inputs: [float('x', 'X', 0), float('y', 'Y', 0)],
    outputs: [{ name: 'vector', label: 'Vec2', type: 'vec2' }],
    lower: ({ b, inputs }) => ({ vector: b.construct('vec2', [inputs.x, inputs.y]) }),
  },
  {
    type: 'vec3',
    label: 'Vec3',
    description: 'Packs three numbers into a vec3. A vec3 is often used for a color (red, green, blue).',
    category: 'vector',
    inputs: [float('x', 'X', 0), float('y', 'Y', 0), float('z', 'Z', 0)],
    outputs: [{ name: 'vector', label: 'Vec3', type: 'vec3' }],
    lower: ({ b, inputs }) => ({ vector: b.construct('vec3', [inputs.x, inputs.y, inputs.z]) }),
  },
  {
    type: 'split',
    label: 'Split',
    description: 'Extracts the individual numbers (x, y, z, w) of a vector.',
    category: 'vector',
    inputs: [gen('value', 'Value', 0)],
    outputs: [
      { name: 'x', label: 'X', type: 'float' },
      { name: 'y', label: 'Y', type: 'float' },
      { name: 'z', label: 'Z', type: 'float' },
      { name: 'w', label: 'W', type: 'float' },
    ],
    lower: ({ b, type, inputs }) => {
      const count = { float: 1, vec2: 2, vec3: 3, vec4: 4 }[type]
      const out: Record<string, number> = {}
      for (const c of 'xyzw'.slice(0, count)) out[c] = b.swizzle(inputs.value, c)
      return out
    },
  },

  // ── Colors ────────────────────────────────────────────────────────────
  {
    type: 'hsv',
    label: 'HSV',
    description:
      'Makes a color from Hue (the position on the rainbow, repeating every 1), Saturation (0 is gray, 1 is vivid) and Value (0 is black, 1 is bright).',
    category: 'color',
    inputs: [float('hue', 'Hue', 0), float('saturation', 'Saturation', 1), float('value', 'Value', 1)],
    outputs: [{ name: 'color', label: 'Color', type: 'vec3' }],
    lower: ({ b, inputs }) => {
      const v3 = (x: number) => b.constant('vec3', [x, x, x])
      // Red, green and blue each follow a "triangle wave" of the hue, shifted by a third.
      const hue6 = b.op('mul', [b.convert(inputs.hue, 'vec3'), v3(6)])
      const shifted = b.op('add', [hue6, b.constant('vec3', [0, 4, 2])])
      const wrapped = b.op('mod', [shifted, v3(6)])
      const triangle = b.op('sub', [b.op('abs', [b.op('sub', [wrapped, v3(3)])]), v3(1)])
      const rgb = b.op('clamp', [triangle, v3(0), v3(1)])
      const tinted = b.op('mix', [v3(1), rgb, b.convert(inputs.saturation, 'vec3')])
      return { color: b.op('mul', [tinted, b.convert(inputs.value, 'vec3')]) }
    },
  },
  {
    type: 'cosine-palette',
    label: 'Cosine Palette',
    description:
      'Turns a number into a smooth, cycling color: A + B × cos(2π × (C × T + D)). Change A and B for brightness and contrast, C for repetition, D for the hues.',
    category: 'color',
    inputs: [
      float('t', 'T', 0),
      { name: 'a', label: 'A', type: 'vec3', default: [0.5, 0.5, 0.5], widget: 'color' },
      { name: 'b', label: 'B', type: 'vec3', default: [0.5, 0.5, 0.5], widget: 'color' },
      { name: 'c', label: 'C', type: 'vec3', default: [1, 1, 1] },
      { name: 'd', label: 'D', type: 'vec3', default: [0, 0.33, 0.67] },
    ],
    outputs: [{ name: 'color', label: 'Color', type: 'vec3' }],
    lower: ({ b, inputs: v }) => {
      const t = b.convert(v.t, 'vec3')
      const phase = b.op('add', [b.op('mul', [v.c, t]), v.d])
      const wave = b.op('cos', [b.op('mul', [phase, b.constant('vec3', [Math.PI * 2, Math.PI * 2, Math.PI * 2])])])
      return { color: b.op('add', [v.a, b.op('mul', [v.b, wave])]) }
    },
  },

  // ── Math ──────────────────────────────────────────────────────────────
  mathNode('add', 'Add', 'Adds A and B. On vectors, each component is added separately.', 'add', ab(0, 0)),
  mathNode('subtract', 'Subtract', 'Subtracts B from A.', 'sub', ab(0, 0)),
  mathNode('multiply', 'Multiply', 'Multiplies A by B. On vectors, each component is multiplied separately.', 'mul', ab(1, 1)),
  mathNode('divide', 'Divide', 'Divides A by B.', 'div', ab(1, 1)),
  mathNode('sin', 'Sin', 'Sine wave: smoothly oscillates between -1 and 1.', 'sin', x()),
  mathNode('cos', 'Cos', 'Cosine wave: like sine, but shifted by a quarter of a period.', 'cos', x()),
  mathNode('abs', 'Abs', 'Absolute value: removes the sign, so -0.5 becomes 0.5.', 'abs', x()),
  mathNode('fract', 'Fract', 'Keeps only the fractional part: 1.75 becomes 0.75. Great for repeating patterns.', 'fract', x()),
  mathNode(
    'mix',
    'Mix',
    'Blends A and B. T = 0 gives A, T = 1 gives B, and 0.5 gives the average of both.',
    'mix',
    [gen('a', 'A', 0), gen('b', 'B', 1), gen('t', 'T', 0.5)],
  ),
  mathNode(
    'smoothstep',
    'Smoothstep',
    'Smooth transition from 0 to 1 as X goes from Edge 0 to Edge 1.',
    'smoothstep',
    [gen('edge0', 'Edge 0', 0), gen('edge1', 'Edge 1', 1), gen('x', 'X', 0.5)],
  ),
  mathNode(
    'step',
    'Step',
    'Hard threshold: 0 when X is below the edge, 1 otherwise.',
    'step',
    [gen('edge', 'Edge', 0.5), gen('x', 'X', 0)],
  ),
  mathNode('floor', 'Floor', 'Rounds down to the nearest whole number: 1.75 becomes 1. Useful for tiles and steps.', 'floor', x()),
  mathNode('min', 'Min', 'The smaller of A and B.', 'min', ab(0, 1)),
  mathNode('max', 'Max', 'The larger of A and B.', 'max', ab(0, 1)),
  mathNode('pow', 'Power', 'Raises Base to the power of Exponent. An exponent above 1 darkens mid-tones.', 'pow', [
    gen('base', 'Base', 0.5),
    gen('exponent', 'Exponent', 2),
  ]),
  mathNode('mod', 'Mod', 'Remainder of Value divided by Divisor: it wraps around, repeating from 0. 1.5 mod 1 is 0.5.', 'mod', [
    gen('value', 'Value', 1.5),
    gen('divisor', 'Divisor', 1),
  ]),
  mathNode('clamp', 'Clamp', 'Limits X to stay between Min and Max.', 'clamp', [
    gen('x', 'X', 0.5),
    gen('min', 'Min', 0),
    gen('max', 'Max', 1),
  ]),
  {
    type: 'one-minus',
    label: 'One Minus',
    description: 'Computes 1 - X. It inverts a mask or a gradient: 0 becomes 1 and 1 becomes 0.',
    category: 'math',
    inputs: x(),
    outputs: [{ name: 'result', label: 'Result', type: 'gen' }],
    lower: ({ b, type, inputs }) => ({
      result: b.op('sub', [b.convert(b.constant('float', [1]), type), inputs.x]),
    }),
  },
  {
    type: 'remap',
    label: 'Remap',
    description:
      'Converts a value from one range to another. By default it maps -1…1 (like Sin) to 0…1, which suits colors.',
    category: 'math',
    inputs: [
      gen('value', 'Value', 0),
      gen('fromMin', 'From min', -1),
      gen('fromMax', 'From max', 1),
      gen('toMin', 'To min', 0),
      gen('toMax', 'To max', 1),
    ],
    outputs: [{ name: 'result', label: 'Result', type: 'gen' }],
    lower: ({ b, inputs: v }) => {
      const progress = b.op('div', [b.op('sub', [v.value, v.fromMin]), b.op('sub', [v.fromMax, v.fromMin])])
      return { result: b.op('add', [v.toMin, b.op('mul', [progress, b.op('sub', [v.toMax, v.toMin])])]) }
    },
  },
  {
    type: 'rotate',
    label: 'Rotate',
    description: 'Rotates a 2D position around the origin by an angle in radians (3.14159 is half a turn).',
    category: 'vector',
    inputs: [{ name: 'position', label: 'Position', type: 'vec2', default: [0, 0] }, float('angle', 'Angle', 0)],
    outputs: [{ name: 'position', label: 'Position', type: 'vec2' }],
    lower: ({ b, inputs }) => {
      const px = b.swizzle(inputs.position, 'x')
      const py = b.swizzle(inputs.position, 'y')
      const c = b.op('cos', [inputs.angle])
      const s = b.op('sin', [inputs.angle])
      const rx = b.op('sub', [b.op('mul', [px, c]), b.op('mul', [py, s])])
      const ry = b.op('add', [b.op('mul', [px, s]), b.op('mul', [py, c])])
      return { position: b.construct('vec2', [rx, ry]) }
    },
  },
  mathNode('length', 'Length', 'Length of a vector. For a 2D position, it is the distance from the origin.', 'length', [
    gen('value', 'Value', 0),
  ], 'float'),
  {
    type: 'distance',
    label: 'Distance',
    description: 'How far apart A and B are. For two 2D positions, it is the straight-line distance between the points.',
    category: 'math',
    inputs: ab(0, 0),
    outputs: [{ name: 'result', label: 'Result', type: 'float' }],
    lower: ({ b, inputs: v }) => ({ result: b.op('length', [b.op('sub', [v.a, v.b])]) }),
  },
  {
    type: 'round',
    label: 'Round',
    description: 'Rounds to the nearest whole number: 1.4 becomes 1 and 1.6 becomes 2.',
    category: 'math',
    inputs: x(),
    outputs: [{ name: 'result', label: 'Result', type: 'gen' }],
    lower: ({ b, type, inputs }) => ({
      result: b.op('floor', [b.op('add', [inputs.x, b.convert(b.constant('float', [0.5]), type)])]),
    }),
  },
  {
    type: 'tile',
    label: 'Tile',
    description:
      'Repeats the space: the 0…1 square is copied Count times in each direction, and every copy goes from 0 to 1 again. Great for patterns.',
    category: 'vector',
    inputs: [{ name: 'position', label: 'Position', type: 'vec2', default: [0, 0] }, float('count', 'Count', 4)],
    outputs: [{ name: 'position', label: 'Position', type: 'vec2' }],
    lower: ({ b, inputs }) => ({
      position: b.op('fract', [b.op('mul', [inputs.position, b.construct('vec2', [inputs.count])])]),
    }),
  },
  {
    type: 'circle',
    label: 'Circle',
    description:
      'A mask: 1 inside a circle and 0 outside, with a soft edge. Use it to mix two colors. The center is in the same space as the position (0…1 for UV, 0 for Centered UV).',
    category: 'math',
    inputs: [
      { name: 'position', label: 'Position', type: 'vec2', default: [0.5, 0.5] },
      { name: 'center', label: 'Center', type: 'vec2', default: [0.5, 0.5] },
      float('radius', 'Radius', 0.3),
      float('softness', 'Softness', 0.02),
    ],
    outputs: [{ name: 'result', label: 'Result', type: 'float' }],
    lower: ({ b, inputs: v }) => {
      const d = b.op('length', [b.op('sub', [v.position, v.center])])
      const edge = b.op('smoothstep', [b.op('sub', [v.radius, v.softness]), b.op('add', [v.radius, v.softness]), d])
      return { result: b.op('sub', [b.constant('float', [1]), edge]) }
    },
  },
  {
    type: 'noise',
    label: 'Noise',
    description: 'Smooth random value between 0 and 1 for each 2D position. Scale the position to change the detail.',
    category: 'math',
    inputs: [{ name: 'position', label: 'Position', type: 'vec2', default: [0, 0] }],
    outputs: [{ name: 'result', label: 'Result', type: 'float' }],
    lower: ({ b, inputs }) => ({ result: b.op('noise', [inputs.position]) }),
  },
  {
    type: 'fractal-noise',
    label: 'Fractal Noise',
    description:
      'Several layers of Noise added together: each layer is twice as detailed and weaker than the one before. This is how clouds, smoke and terrain get their natural look. Gain is how much of each layer is kept (lower is smoother).',
    category: 'math',
    inputs: [{ name: 'position', label: 'Position', type: 'vec2', default: [0, 0] }, float('gain', 'Gain', 0.5)],
    outputs: [{ name: 'result', label: 'Result', type: 'float' }],
    lower: ({ b, inputs: v }) => {
      const one = (x: number) => b.constant('float', [x])
      const pair = (x: number, y: number) => b.constant('vec2', [x, y])
      let position = v.position
      let weight = one(1)
      let sum = b.op('noise', [position])
      let total = weight
      // 4 more layers: zoom in (×2.03, a bit more than 2 so the grids never line up) and shift
      for (let octave = 1; octave < 5; octave++) {
        position = b.op('add', [b.op('mul', [position, pair(2.03, 2.03)]), pair(17.3, 9.1)])
        weight = b.op('mul', [weight, v.gain])
        sum = b.op('add', [sum, b.op('mul', [b.op('noise', [position]), weight])])
        total = b.op('add', [total, weight])
      }
      return { result: b.op('div', [sum, total]) }
    },
  },
]
