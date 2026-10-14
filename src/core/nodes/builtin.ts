import type { IRBuilder } from '../ir/builder'
import type { ValueId } from '../ir/ir'
import type { OpName } from '../ir/ops'
import type { InputPortDef, NodeCategory, NodeDef } from './definition'
import { DEFAULT_RAMP, readRamp } from './ramp'

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

/** A 2D position. Left unwired, it is the pixel's UV, so the node shows something right away. */
const position = (): InputPortDef => ({ name: 'position', label: 'Position', type: 'vec2', default: 'uv' })

/** A 0…1 screen position → (0, 0) in the middle, with the aspect ratio corrected (see Centered UV). */
function centered(b: IRBuilder, position: ValueId): ValueId {
  const resolution = b.input('resolution')
  const aspect = b.op('div', [b.swizzle(resolution, 'x'), b.swizzle(resolution, 'y')])
  const scale = b.construct('vec2', [aspect, b.constant('float', [1])])
  return b.op('mul', [b.op('sub', [position, b.constant('vec2', [0.5, 0.5])]), scale])
}

/** 1 below `radius` and 0 above, blending over `softness` on each side. */
function softMask(b: IRBuilder, distance: ValueId, radius: ValueId, softness: ValueId): ValueId {
  const edge = b.op('smoothstep', [b.op('sub', [radius, softness]), b.op('add', [radius, softness]), distance])
  return b.op('sub', [b.constant('float', [1]), edge])
}

/**
 * A node applying one IR op to its inputs. `args` names the ports in the order the op
 * takes them, when the node shows them in another order (the value to wire comes first).
 */
function mathNode(
  category: NodeCategory,
  type: string,
  label: string,
  description: string,
  op: OpName,
  inputs: InputPortDef[],
  { output = 'gen', args = inputs.map((p) => p.name) }: { output?: 'gen' | 'float'; args?: string[] } = {},
): NodeDef {
  return {
    type,
    label,
    description,
    category,
    inputs,
    outputs: [{ name: 'result', label: 'Result', type: output }],
    lower: ({ b, inputs: v }) => ({ result: b.op(op, args.map((name) => v[name])) }),
  }
}

/** Adds up the components of a vector (a float is returned as is). */
function sumComponents(b: IRBuilder, value: ValueId): ValueId {
  const type = b.typeOf(value)
  if (type === 'float') return value
  const parts = [...'xyzw'.slice(0, { vec2: 2, vec3: 3, vec4: 4 }[type])].map((c) => b.swizzle(value, c))
  return parts.slice(1).reduce((sum, part) => b.op('add', [sum, part]), parts[0])
}

/** Most cells a Voronoi looks at around the pixel: its own and the 8 around it. */
const VORONOI_NEIGHBORS = [-1, 0, 1].flatMap((y) => [-1, 0, 1].map((x) => [x, y] as const))

const ab = (a: number, b: number) => [gen('a', 'A', a), gen('b', 'B', b)]
const x = (value = 0) => [gen('x', 'X', value)]

const center = (): InputPortDef => ({ name: 'center', label: 'Center', type: 'vec2', default: [0.5, 0.5] })

/** Where positions are measured from, for the nodes that take a Center. */
const CENTER_HELP =
  'The center is in the same space as the position: (0.5, 0.5) is the middle of the screen for UV, (0, 0) for Centered UV.'

/** Layers of a Fractal Noise: each one is 4 more hashes per pixel, so the count is bounded. */
const MAX_NOISE_LAYERS = 8

/** Nodes are listed in the order the palette shows them: one section per category. */
export const BUILTIN_NODES: NodeDef[] = [
  // ── Output ───────────────────────────────────────────────────────────────
  {
    type: 'output',
    label: 'Output',
    description: 'The final color of each pixel. Every shader ends here.',
    category: 'output',
    inputs: [{ name: 'color', label: 'Color', type: 'vec3', default: [0, 0, 0], widget: 'color' }],
    outputs: [{ name: 'color', label: 'Color', type: 'vec3' }],
    lower: ({ inputs }) => ({ color: inputs.color }),
  },

  // ── Input ────────────────────────────────────────────────────────────────
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
    type: 'centered-uv',
    label: 'Centered UV',
    description:
      'Screen position with (0, 0) in the middle, corrected for the aspect ratio so circles stay round. Height goes from -0.5 to 0.5.',
    category: 'input',
    inputs: [],
    outputs: [{ name: 'uv', label: 'UV', type: 'vec2' }],
    lower: ({ b }) => ({ uv: centered(b, b.input('uv')) }),
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
    type: 'mouse',
    label: 'Mouse',
    description:
      'Where the pointer is over the result. Position is in the same space as UV, Centered in the same space as Centered UV. Move the pointer over the result (or drag a finger on it) to try.',
    category: 'input',
    inputs: [],
    outputs: [
      { name: 'position', label: 'Position', type: 'vec2' },
      { name: 'centered', label: 'Centered', type: 'vec2' },
    ],
    lower: ({ b }) => ({ position: b.input('mouse'), centered: centered(b, b.input('mouse')) }),
  },
  {
    type: 'float',
    label: 'Float',
    description: 'A constant number.',
    category: 'input',
    preview: 'none',
    inputs: [float('value', 'Value', 0, false)],
    outputs: [{ name: 'value', label: 'Value', type: 'float' }],
    lower: ({ inputs }) => ({ value: inputs.value }),
  },
  {
    type: 'color',
    label: 'Color',
    description: 'A constant color, stored as a vec3 of red, green and blue between 0 and 1.',
    category: 'input',
    preview: 'none',
    inputs: [{ name: 'color', label: 'Color', type: 'vec3', default: [1, 1, 1], connectable: false, widget: 'color' }],
    outputs: [{ name: 'color', label: 'Color', type: 'vec3' }],
    lower: ({ inputs }) => ({ color: inputs.color }),
  },

  // ── Math ─────────────────────────────────────────────────────────────────
  mathNode('math', 'add', 'Add', 'Adds A and B. On vectors, each component is added separately.', 'add', ab(0, 0)),
  mathNode('math', 'subtract', 'Subtract', 'Subtracts B from A.', 'sub', ab(0, 0)),
  mathNode(
    'math',
    'multiply',
    'Multiply',
    'Multiplies A by B. On vectors, each component is multiplied separately.',
    'mul',
    ab(1, 1),
  ),
  mathNode('math', 'divide', 'Divide', 'Divides A by B.', 'div', ab(1, 1)),
  mathNode('math', 'pow', 'Power', 'Raises Base to the power of Exponent. An exponent above 1 darkens mid-tones.', 'pow', [
    gen('base', 'Base', 0.5),
    gen('exponent', 'Exponent', 2),
  ]),
  mathNode('math', 'abs', 'Abs', 'Absolute value: removes the sign, so -0.5 becomes 0.5.', 'abs', x()),
  mathNode(
    'math',
    'sqrt',
    'Square Root',
    'The number that, multiplied by itself, gives X: the square root of 0.25 is 0.5. On a 0…1 gradient it brightens the dark end.',
    'sqrt',
    x(0.25),
  ),
  mathNode(
    'math',
    'sign',
    'Sign',
    'Tells on which side of zero X is: -1 when negative, 0 at zero, 1 when positive.',
    'sign',
    x(),
  ),

  // ── Trigonometry ─────────────────────────────────────────────────────────
  mathNode('trigonometry', 'sin', 'Sin', 'Sine wave: smoothly oscillates between -1 and 1.', 'sin', x()),
  mathNode('trigonometry', 'cos', 'Cos', 'Cosine wave: like sine, but shifted by a quarter of a period.', 'cos', x()),

  // ── Round ────────────────────────────────────────────────────────────────
  mathNode(
    'round',
    'floor',
    'Floor',
    'Rounds down to the nearest whole number: 1.75 becomes 1. Useful for tiles and steps.',
    'floor',
    x(),
  ),
  mathNode('round', 'ceil', 'Ceil', 'Rounds up to the nearest whole number: 1.25 becomes 2.', 'ceil', x()),
  {
    type: 'round',
    label: 'Round',
    description: 'Rounds to the nearest whole number: 1.4 becomes 1 and 1.6 becomes 2.',
    category: 'round',
    inputs: x(),
    outputs: [{ name: 'result', label: 'Result', type: 'gen' }],
    lower: ({ b, type, inputs }) => ({
      result: b.op('floor', [b.op('add', [inputs.x, b.convert(b.constant('float', [0.5]), type)])]),
    }),
  },
  mathNode(
    'round',
    'fract',
    'Fract',
    'Keeps only the fractional part: 1.75 becomes 0.75. Great for repeating patterns.',
    'fract',
    x(),
  ),
  mathNode(
    'round',
    'mod',
    'Mod',
    'Remainder of Value divided by Divisor: it wraps around, repeating from 0. 1.5 mod 1 is 0.5.',
    'mod',
    [gen('value', 'Value', 1.5), gen('divisor', 'Divisor', 1)],
  ),
  mathNode(
    'round',
    'step',
    'Step',
    'Hard threshold: 0 when X is below the edge, 1 otherwise.',
    'step',
    [gen('x', 'X', 0), gen('edge', 'Edge', 0.5)],
    { args: ['edge', 'x'] },
  ),

  // ── Range ────────────────────────────────────────────────────────────────
  mathNode('range', 'clamp', 'Clamp', 'Limits X to stay between Min and Max.', 'clamp', [
    gen('x', 'X', 0.5),
    gen('min', 'Min', 0),
    gen('max', 'Max', 1),
  ]),
  {
    type: 'saturate',
    label: 'Saturate',
    description:
      'Keeps X between 0 and 1: below 0 becomes 0, above 1 becomes 1. A Clamp with Min 0 and Max 1, the range colors and masks live in.',
    category: 'range',
    inputs: x(1.5),
    outputs: [{ name: 'result', label: 'Result', type: 'gen' }],
    lower: ({ b, type, inputs }) => ({
      result: b.op('clamp', [inputs.x, b.convert(b.constant('float', [0]), type), b.convert(b.constant('float', [1]), type)]),
    }),
  },
  {
    type: 'remap',
    label: 'Remap',
    description:
      'Converts a value from one range to another. By default it maps -1…1 (like Sin) to 0…1, which suits colors.',
    category: 'range',
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
  mathNode('range', 'min', 'Min', 'The smaller of A and B.', 'min', ab(0, 1)),
  mathNode('range', 'max', 'Max', 'The larger of A and B.', 'max', ab(0, 1)),
  {
    type: 'one-minus',
    label: 'One Minus',
    description: 'Computes 1 - X. It inverts a mask or a gradient: 0 becomes 1 and 1 becomes 0.',
    category: 'range',
    inputs: x(),
    outputs: [{ name: 'result', label: 'Result', type: 'gen' }],
    lower: ({ b, type, inputs }) => ({
      result: b.op('sub', [b.convert(b.constant('float', [1]), type), inputs.x]),
    }),
  },

  // ── Interpolation ────────────────────────────────────────────────────────
  mathNode('interpolation', 'mix', 'Mix', 'Blends A and B. T = 0 gives A, T = 1 gives B, and 0.5 gives the average of both.', 'mix', [
    gen('a', 'A', 0),
    gen('b', 'B', 1),
    gen('t', 'T', 0.5),
  ]),
  mathNode(
    'interpolation',
    'smoothstep',
    'Smoothstep',
    'Smooth transition from 0 to 1 as X goes from Edge 0 to Edge 1.',
    'smoothstep',
    [gen('x', 'X', 0.5), gen('edge0', 'Edge 0', 0), gen('edge1', 'Edge 1', 1)],
    { args: ['edge0', 'edge1', 'x'] },
  ),

  // ── Vector ───────────────────────────────────────────────────────────────
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
  mathNode(
    'vector',
    'length',
    'Length',
    'Length of a vector. For a 2D position, it is the distance from the origin.',
    'length',
    [gen('value', 'Value', 0)],
    { output: 'float' },
  ),
  {
    type: 'distance',
    label: 'Distance',
    description: 'How far apart A and B are. For two 2D positions, it is the straight-line distance between the points.',
    category: 'vector',
    inputs: ab(0, 0),
    outputs: [{ name: 'result', label: 'Result', type: 'float' }],
    lower: ({ b, inputs: v }) => ({ result: b.op('length', [b.op('sub', [v.a, v.b])]) }),
  },
  {
    type: 'dot',
    label: 'Dot',
    description:
      'Multiplies A and B component by component and adds the results up. For two directions of length 1, it is 1 when they point the same way, 0 when they are at a right angle and -1 when opposite: the basis of lighting.',
    category: 'vector',
    inputs: ab(1, 1),
    outputs: [{ name: 'result', label: 'Result', type: 'float' }],
    lower: ({ b, inputs: v }) => ({ result: sumComponents(b, b.op('mul', [v.a, v.b])) }),
  },
  {
    type: 'normalize',
    label: 'Normalize',
    description:
      'Keeps the direction of a vector but makes its length 1, by dividing it by its length. Useful to compare directions with Dot. A zero vector has no direction: the result is undefined.',
    category: 'vector',
    inputs: [gen('value', 'Value', 1)],
    outputs: [{ name: 'result', label: 'Result', type: 'gen' }],
    lower: ({ b, type, inputs }) => ({
      result: b.op('div', [inputs.value, b.convert(b.op('length', [inputs.value]), type)]),
    }),
  },

  // ── UV ───────────────────────────────────────────────────────────────────
  {
    type: 'tiling-offset',
    label: 'Tiling and Offset',
    description:
      'Scales then moves a position: Position × Tiling + Offset. A Tiling of 2 makes everything drawn with it twice smaller (it fits twice), an Offset slides it. Wire Time into Offset to scroll.',
    category: 'uv',
    inputs: [
      position(),
      { name: 'tiling', label: 'Tiling', type: 'vec2', default: [1, 1] },
      { name: 'offset', label: 'Offset', type: 'vec2', default: [0, 0] },
    ],
    outputs: [{ name: 'position', label: 'Position', type: 'vec2' }],
    lower: ({ b, inputs: v }) => ({ position: b.op('add', [b.op('mul', [v.position, v.tiling]), v.offset]) }),
  },
  {
    type: 'tile',
    label: 'Tile',
    description:
      'Repeats the space: the 0…1 square is copied Count times in each direction, and every copy goes from 0 to 1 again. Cell is the number of the copy (0, 1, 2… in X and in Y): use it to make each copy different.',
    category: 'uv',
    inputs: [position(), float('count', 'Count', 4)],
    outputs: [
      { name: 'position', label: 'Position', type: 'vec2' },
      { name: 'cell', label: 'Cell', type: 'vec2' },
    ],
    lower: ({ b, inputs }) => {
      const scaled = b.op('mul', [inputs.position, b.construct('vec2', [inputs.count])])
      return { position: b.op('fract', [scaled]), cell: b.op('floor', [scaled]) }
    },
  },
  {
    type: 'rotate',
    label: 'Rotate',
    description:
      'Rotates a 2D position around Center by an angle in radians (3.14159 is half a turn). ' + CENTER_HELP,
    category: 'uv',
    inputs: [position(), float('angle', 'Angle', 0), center()],
    outputs: [{ name: 'position', label: 'Position', type: 'vec2' }],
    lower: ({ b, inputs }) => {
      const fromCenter = b.op('sub', [inputs.position, inputs.center])
      const px = b.swizzle(fromCenter, 'x')
      const py = b.swizzle(fromCenter, 'y')
      const c = b.op('cos', [inputs.angle])
      const s = b.op('sin', [inputs.angle])
      const rx = b.op('sub', [b.op('mul', [px, c]), b.op('mul', [py, s])])
      const ry = b.op('add', [b.op('mul', [px, s]), b.op('mul', [py, c])])
      return { position: b.op('add', [b.construct('vec2', [rx, ry]), inputs.center]) }
    },
  },
  {
    type: 'fisheye',
    label: 'Fisheye',
    description:
      'Bends the space like a fisheye lens: positions are pushed away from Center, more and more as they get far from it, so whatever is drawn with them bulges in the middle. A negative Strength pinches instead. ' +
      CENTER_HELP,
    category: 'uv',
    inputs: [position(), center(), float('strength', 'Strength', 1.5)],
    outputs: [{ name: 'position', label: 'Position', type: 'vec2' }],
    lower: ({ b, inputs }) => {
      const fromCenter = b.op('sub', [inputs.position, inputs.center])
      const distance = b.op('length', [fromCenter])
      // 1 at the center, growing with the square of the distance: flat in the middle, bent at the edges.
      const squared = b.op('mul', [distance, distance])
      const push = b.op('add', [b.constant('float', [1]), b.op('mul', [squared, inputs.strength])])
      return { position: b.op('add', [b.op('mul', [fromCenter, b.construct('vec2', [push])]), inputs.center]) }
    },
  },
  {
    type: 'polar',
    label: 'Polar',
    description:
      'Describes a position by its distance from Center (Radius) and its direction (Angle, from 0 to 1 over a full turn, starting on the left). Use Angle for rays, pie slices and spirals, Radius for rings. ' +
      CENTER_HELP,
    category: 'uv',
    inputs: [position(), center()],
    outputs: [
      { name: 'radius', label: 'Radius', type: 'float' },
      { name: 'angle', label: 'Angle', type: 'float' },
    ],
    lower: ({ b, inputs }) => {
      const fromCenter = b.op('sub', [inputs.position, inputs.center])
      const radians = b.op('atan2', [b.swizzle(fromCenter, 'y'), b.swizzle(fromCenter, 'x')])
      // -π…π → 0…1
      const turns = b.op('add', [b.op('div', [radians, b.constant('float', [Math.PI * 2])]), b.constant('float', [0.5])])
      return { radius: b.op('length', [fromCenter]), angle: turns }
    },
  },

  // ── Procedural ───────────────────────────────────────────────────────────
  {
    type: 'circle',
    label: 'Circle',
    description: 'A mask: 1 inside a circle and 0 outside, with a soft edge. Use it to mix two colors. ' + CENTER_HELP,
    category: 'procedural',
    inputs: [position(), center(), float('radius', 'Radius', 0.3), float('softness', 'Softness', 0.02)],
    outputs: [{ name: 'result', label: 'Result', type: 'float' }],
    lower: ({ b, inputs: v }) => ({
      result: softMask(b, b.op('length', [b.op('sub', [v.position, v.center])]), v.radius, v.softness),
    }),
  },
  {
    type: 'rectangle',
    label: 'Rectangle',
    description:
      'A mask: 1 inside a rectangle and 0 outside, with a soft edge. Size is its width and height. ' + CENTER_HELP,
    category: 'procedural',
    inputs: [
      position(),
      center(),
      { name: 'size', label: 'Size', type: 'vec2', default: [0.6, 0.4] },
      float('softness', 'Softness', 0.02),
    ],
    outputs: [{ name: 'result', label: 'Result', type: 'float' }],
    lower: ({ b, inputs: v }) => {
      // How far the position is past the sides, in X and in Y (negative inside).
      const half = b.op('mul', [v.size, b.constant('vec2', [0.5, 0.5])])
      const outside = b.op('sub', [b.op('abs', [b.op('sub', [v.position, v.center])]), half])
      const soft = b.construct('vec2', [v.softness])
      const edge = b.op('smoothstep', [b.op('sub', [b.constant('vec2', [0, 0]), soft]), soft, outside])
      const inside = b.op('sub', [b.constant('vec2', [1, 1]), edge])
      return { result: b.op('mul', [b.swizzle(inside, 'x'), b.swizzle(inside, 'y')]) }
    },
  },
  {
    type: 'polygon',
    label: 'Polygon',
    description:
      'A mask: 1 inside a regular polygon (3 sides is a triangle, 6 a hexagon…) and 0 outside, with a soft edge. Radius is the distance from the center to the middle of a side. ' +
      CENTER_HELP,
    category: 'procedural',
    inputs: [
      position(),
      center(),
      float('radius', 'Radius', 0.3),
      float('sides', 'Sides', 6),
      float('softness', 'Softness', 0.02),
    ],
    outputs: [{ name: 'result', label: 'Result', type: 'float' }],
    lower: ({ b, inputs: v }) => {
      const one = (x: number) => b.constant('float', [x])
      const fromCenter = b.op('sub', [v.position, v.center])
      const angle = b.op('add', [b.op('atan2', [b.swizzle(fromCenter, 'x'), b.swizzle(fromCenter, 'y')]), one(Math.PI)])
      // Angle taken by one side, then the direction of the middle of the nearest side.
      const slice = b.op('div', [one(Math.PI * 2), v.sides])
      const nearest = b.op('mul', [b.op('floor', [b.op('add', [b.op('div', [angle, slice]), one(0.5)])]), slice])
      // Distance measured along that direction: it is the same all along a side.
      const distance = b.op('mul', [b.op('cos', [b.op('sub', [nearest, angle])]), b.op('length', [fromCenter])])
      return { result: softMask(b, distance, v.radius, v.softness) }
    },
  },
  {
    type: 'checkerboard',
    label: 'Checkerboard',
    description:
      'A mask of alternating squares, like a chessboard: 1 on one color, 0 on the other. Count is the number of squares across the 0…1 square. It adds the row and column numbers: even is 0, odd is 1.',
    category: 'procedural',
    inputs: [position(), float('count', 'Count', 8)],
    outputs: [{ name: 'result', label: 'Result', type: 'float' }],
    lower: ({ b, inputs: v }) => {
      const cell = b.op('floor', [b.op('mul', [v.position, b.construct('vec2', [v.count])])])
      const sum = b.op('add', [b.swizzle(cell, 'x'), b.swizzle(cell, 'y')])
      return { result: b.op('mod', [sum, b.constant('float', [2])]) }
    },
  },
  {
    type: 'random',
    label: 'Random',
    description:
      'A random value between 0 and 1 for each seed: the same seed always gives the same value, two different seeds give unrelated values. Wire the Cell of a Tile to make each copy different. Unwired, every pixel gets its own value, like TV static.',
    category: 'procedural',
    inputs: [{ name: 'seed', label: 'Seed', type: 'vec2', default: 'uv' }],
    outputs: [{ name: 'result', label: 'Result', type: 'float' }],
    lower: ({ b, inputs }) => ({ result: b.op('random', [inputs.seed]) }),
  },
  {
    type: 'noise',
    label: 'Noise',
    description:
      'Smooth random value between 0 and 1 for each 2D position. Scale is the number of blobs across the 0…1 square: higher is finer.',
    category: 'procedural',
    inputs: [position(), float('scale', 'Scale', 5)],
    outputs: [{ name: 'result', label: 'Result', type: 'float' }],
    lower: ({ b, inputs }) => ({
      result: b.op('noise', [b.op('mul', [inputs.position, b.construct('vec2', [inputs.scale])])]),
    }),
  },
  {
    type: 'fractal-noise',
    label: 'Fractal Noise',
    description:
      'Several layers of Noise added together: each layer is twice as detailed and weaker than the one before. This is how clouds, smoke and terrain get their natural look. Detail is the number of layers; Roughness is how much of each new layer is kept (lower is smoother).',
    category: 'procedural',
    inputs: [
      position(),
      float('scale', 'Scale', 5),
      { ...float('detail', 'Detail', 5, false), whole: { min: 1, max: MAX_NOISE_LAYERS } },
      float('gain', 'Roughness', 0.5),
    ],
    outputs: [{ name: 'result', label: 'Result', type: 'float' }],
    lower: ({ b, node, inputs: v }) => {
      const one = (x: number) => b.constant('float', [x])
      const pair = (x: number, y: number) => b.constant('vec2', [x, y])
      const layers = Math.min(MAX_NOISE_LAYERS, Math.max(1, Math.round(node.values.detail?.[0] ?? 5)))
      let position = b.op('mul', [v.position, b.construct('vec2', [v.scale])])
      let weight = one(1)
      let sum = b.op('noise', [position])
      let total = weight
      // The other layers: zoom in (×2.03, a bit more than 2 so the grids never line up) and shift
      for (let layer = 1; layer < layers; layer++) {
        position = b.op('add', [b.op('mul', [position, pair(2.03, 2.03)]), pair(17.3, 9.1)])
        weight = b.op('mul', [weight, v.gain])
        sum = b.op('add', [sum, b.op('mul', [b.op('noise', [position]), weight])])
        total = b.op('add', [total, weight])
      }
      return { result: b.op('div', [sum, total]) }
    },
  },
  {
    type: 'voronoi',
    label: 'Voronoi',
    description:
      'Cells, like stones, scales or bubbles. The space is cut into a grid; each square gets one point at a random place, and every pixel belongs to the nearest point. Distance is how far that point is (dark in the middle of a cell), Cell a random value per cell (to color each one). Randomness 0 lines the points up, 1 scatters them.',
    category: 'procedural',
    inputs: [position(), float('scale', 'Scale', 5), float('randomness', 'Randomness', 1)],
    outputs: [
      { name: 'distance', label: 'Distance', type: 'float' },
      { name: 'cell', label: 'Cell', type: 'float' },
    ],
    lower: ({ b, inputs: v }) => {
      const scaled = b.op('mul', [v.position, b.construct('vec2', [v.scale])])
      const square = b.op('floor', [scaled])
      const inSquare = b.op('fract', [scaled])
      let nearest = b.constant('float', [8])
      let cell = b.constant('float', [0])
      // The nearest point is in this square or one around it: look at all nine.
      for (const [dx, dy] of VORONOI_NEIGHBORS) {
        const offset = b.constant('vec2', [dx, dy])
        const id = b.op('add', [square, offset])
        const jitter = b.construct('vec2', [
          b.op('random', [id]),
          b.op('random', [b.op('add', [id, b.constant('vec2', [17.31, 41.57])])]),
        ])
        const point = b.op('add', [offset, b.op('mul', [jitter, b.construct('vec2', [v.randomness])])])
        const distance = b.op('length', [b.op('sub', [point, inSquare])])
        // 1 when this point is the nearest so far: then its cell value is kept.
        const closer = b.op('step', [distance, nearest])
        cell = b.op('mix', [cell, b.op('random', [b.op('add', [id, b.constant('vec2', [5.13, 3.77])])]), closer])
        nearest = b.op('min', [nearest, distance])
      }
      return { distance: nearest, cell }
    },
  },

  // ── Color ────────────────────────────────────────────────────────────────
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
    type: 'color-ramp',
    label: 'Color Ramp',
    description:
      'Turns a number into a color along a gradient you draw: T = 0 takes the color on the left, 1 the one on the right, and between two stops the color blends from one to the other. Click the bar to add a stop, drag a stop to move it. Unwired, T is the UV\'s X, so the node shows its gradient.',
    category: 'color',
    inputs: [
      { name: 't', label: 'T', type: 'float', default: 'uv' },
      { name: 'stops', label: 'Colors', type: 'vec3', default: DEFAULT_RAMP, connectable: false, widget: 'ramp' },
    ],
    outputs: [{ name: 'color', label: 'Color', type: 'vec3' }],
    lower: ({ b, node, inputs }) => {
      const stops = readRamp(node.values.stops)
      const rgb = (c: number[]) => b.constant('vec3', c)
      // Start from the first color, then blend toward each next one as T crosses the gap to it.
      let color = rgb(stops[0].color)
      for (let i = 1; i < stops.length; i++) {
        const from = stops[i - 1].position
        const width = Math.max(stops[i].position - from, 1e-5)
        const progress = b.op('mul', [b.op('sub', [inputs.t, b.constant('float', [from])]), b.constant('float', [1 / width])])
        const f = b.op('clamp', [progress, b.constant('float', [0]), b.constant('float', [1])])
        color = b.op('mix', [color, rgb(stops[i].color), b.convert(f, 'vec3')])
      }
      return { color }
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
]
