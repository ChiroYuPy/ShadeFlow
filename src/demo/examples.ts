import { getNodeDef, type Graph, type GraphEdge, type GraphNode } from '@/core'

export interface Example {
  id: string
  name: string
  /** One line shown in the menu. */
  description: string
  graph: Graph
}

interface NodeSpec {
  type: string
  x: number
  y: number
  values?: Record<string, number[]>
  /** Text of a `note` node. */
  text?: string
}

/**
 * Compact way to write a graph: nodes by id, wires as `"from.port > to.port"`.
 */
function graphOf(specs: Record<string, NodeSpec>, wires: string[]): Graph {
  const nodes: Record<string, GraphNode> = {}
  for (const [id, s] of Object.entries(specs)) {
    nodes[id] = {
      id,
      type: s.type,
      position: { x: s.x, y: s.y },
      values: s.values ?? {},
      ...(s.text !== undefined ? { text: s.text } : {}),
    }
  }
  const edges: GraphEdge[] = wires.map((w) => {
    const [from, to] = w.split('>').map((p) => p.trim().split('.'))
    return { id: w, from: { nodeId: from[0], port: from[1] }, to: { nodeId: to[0], port: to[1] } }
  })
  return { nodes, edges }
}

const note = (x: number, y: number, text: string): NodeSpec => ({ type: 'note', x, y, text })

/** UV.x scaled and slid by time, repeated into bands, used to blend two colors. */
const slidingGradient = graphOf(
  {
    n1: note(0, -170, 'UV is the position of each pixel, from 0 to 1. Split extracts its X (left to right).'),
    n2: note(720, -120, 'Subtracting time slides the pattern. Fract repeats 0 → 1 over and over, making bands.'),
    n3: note(1200, -50, 'Mix blends two colors: 0 gives the first, 1 gives the second.'),
    uv: { type: 'uv', x: 0, y: 0 },
    split: { type: 'split', x: 240, y: 0 },
    time: { type: 'time', x: 0, y: 300 },
    scaleX: { type: 'multiply', x: 480, y: 0, values: { b: [3] } },
    speed: { type: 'multiply', x: 240, y: 270, values: { b: [0.3] } },
    shift: { type: 'subtract', x: 720, y: 110 },
    repeat: { type: 'fract', x: 960, y: 110 },
    colorA: { type: 'color', x: 720, y: 330, values: { color: [0.1, 0.15, 0.6] } },
    colorB: { type: 'color', x: 720, y: 540, values: { color: [1, 0.55, 0.2] } },
    mix: { type: 'mix', x: 1200, y: 190 },
    out: { type: 'output', x: 1440, y: 190 },
  },
  [
    'uv.uv > split.value',
    'split.x > scaleX.a',
    'time.time > speed.a',
    'scaleX.result > shift.a',
    'speed.result > shift.b',
    'shift.result > repeat.x',
    'colorA.color > mix.a',
    'colorB.color > mix.b',
    'repeat.result > mix.t',
    'mix.result > out.color',
  ],
)

const rings = graphOf(
  {
    n1: note(0, -170, 'Centered UV puts (0, 0) in the middle of the screen. Length is the distance from there: 0 in the center, growing outward.'),
    n2: note(780, -150, 'Sin turns the growing distance into waves. Subtracting time makes them travel.'),
    n3: note(1300, -170, 'Remap converts the wave from −1…1 to 0…1 so it can be a color. Power sharpens the bright rings.'),
    c: { type: 'centered-uv', x: 0, y: 0 },
    len: { type: 'length', x: 260, y: 0 },
    mul: { type: 'multiply', x: 520, y: 0, values: { b: [14] } },
    t: { type: 'time', x: 520, y: 300 },
    sub: { type: 'subtract', x: 780, y: 0 },
    sin: { type: 'sin', x: 1040, y: 0 },
    rm: { type: 'remap', x: 1300, y: 0 },
    pw: { type: 'pow', x: 1560, y: 0, values: { exponent: [3] } },
    out: { type: 'output', x: 1820, y: 0 },
  },
  [
    'c.uv > len.value',
    'len.result > mul.a',
    'mul.result > sub.a',
    't.time > sub.b',
    'sub.result > sin.x',
    'sin.result > rm.value',
    'rm.result > pw.base',
    'pw.result > out.color',
  ],
)

const checkerboard = graphOf(
  {
    n1: note(0, -170, 'Multiplying the position by 6 makes 6 cells fit in the height of the screen.'),
    n2: note(520, -170, 'Rotate spins the whole grid by an angle that grows with time.'),
    n3: note(1040, -190, 'Floor keeps the cell number (0, 1, 2…) of X and Y. Adding them and taking Mod 2 alternates 0 and 1, like a checkerboard.'),
    c: { type: 'centered-uv', x: 0, y: 0 },
    sc: { type: 'multiply', x: 260, y: 0, values: { b: [6] } },
    t: { type: 'time', x: 0, y: 300 },
    ang: { type: 'multiply', x: 260, y: 300, values: { b: [0.3] } },
    rot: { type: 'rotate', x: 520, y: 0 },
    sp: { type: 'split', x: 780, y: 0 },
    fx: { type: 'floor', x: 1040, y: 0 },
    fy: { type: 'floor', x: 1040, y: 280 },
    add: { type: 'add', x: 1300, y: 120 },
    mod: { type: 'mod', x: 1560, y: 120, values: { divisor: [2] } },
    out: { type: 'output', x: 1820, y: 120 },
  },
  [
    'c.uv > sc.a',
    't.time > ang.a',
    'sc.result > rot.position',
    'ang.result > rot.angle',
    'rot.position > sp.value',
    'sp.x > fx.x',
    'sp.y > fy.x',
    'fx.result > add.a',
    'fy.result > add.b',
    'add.result > mod.value',
    'mod.result > out.color',
  ],
)

const clouds = graphOf(
  {
    n1: note(0, -170, 'Noise gives a smooth random value for every position. A bigger scale means more, smaller blobs.'),
    n2: note(520, -170, 'Adding a float to a vec2 adds it to both X and Y: the noise drifts diagonally as time passes.'),
    n3: note(1040, -190, 'The noise value (0…1) drives the Mix between two colors.'),
    uv: { type: 'uv', x: 0, y: 0 },
    scale: { type: 'multiply', x: 260, y: 0, values: { b: [5] } },
    t: { type: 'time', x: 0, y: 300 },
    slow: { type: 'multiply', x: 260, y: 300, values: { b: [0.2] } },
    off: { type: 'add', x: 520, y: 100 },
    nz: { type: 'noise', x: 780, y: 100 },
    colorA: { type: 'color', x: 780, y: 330, values: { color: [0.05, 0.1, 0.35] } },
    colorB: { type: 'color', x: 780, y: 560, values: { color: [0.95, 0.85, 0.7] } },
    mix: { type: 'mix', x: 1040, y: 60 },
    out: { type: 'output', x: 1300, y: 60 },
  },
  [
    'uv.uv > scale.a',
    't.time > slow.a',
    'scale.result > off.a',
    'slow.result > off.b',
    'off.result > nz.position',
    'colorA.color > mix.a',
    'colorB.color > mix.b',
    'nz.result > mix.t',
    'mix.result > out.color',
  ],
)

const rainbow = graphOf(
  {
    n1: note(0, -170, 'UV X goes from 0 to 1 across the screen. Multiplying by 2 makes the rainbow repeat twice.'),
    n2: note(520, -170, 'Time pushes the hue forward, so the colors scroll. Hue wraps around every 1, so it never runs out.'),
    n3: note(1040, -190, 'HSV builds a color from Hue, Saturation and Value. Try lowering Saturation or Value!'),
    uv: { type: 'uv', x: 0, y: 0 },
    sp: { type: 'split', x: 260, y: 0 },
    scale: { type: 'multiply', x: 520, y: 0, values: { b: [2] } },
    t: { type: 'time', x: 260, y: 300 },
    slow: { type: 'multiply', x: 520, y: 300, values: { b: [0.1] } },
    add: { type: 'add', x: 780, y: 100 },
    hsv: { type: 'hsv', x: 1040, y: 100 },
    out: { type: 'output', x: 1300, y: 100 },
  },
  [
    'uv.uv > sp.value',
    'sp.x > scale.a',
    't.time > slow.a',
    'scale.result > add.a',
    'slow.result > add.b',
    'add.result > hsv.hue',
    'hsv.color > out.color',
  ],
)

const paletteRings = graphOf(
  {
    n1: note(0, -170, 'Distance from the center, scaled by 3 so a few rings fit on screen.'),
    n2: note(520, -170, 'Subtracting time makes the rings flow outward.'),
    n3: note(1040, -240, 'Cosine Palette turns a single number into a smooth color. Edit A, B, C or D to design your own palette.'),
    c: { type: 'centered-uv', x: 0, y: 0 },
    len: { type: 'length', x: 260, y: 0 },
    mul: { type: 'multiply', x: 520, y: 0, values: { b: [3] } },
    t: { type: 'time', x: 260, y: 300 },
    slow: { type: 'multiply', x: 520, y: 300, values: { b: [0.3] } },
    sub: { type: 'subtract', x: 780, y: 100 },
    pal: { type: 'cosine-palette', x: 1040, y: 0 },
    out: { type: 'output', x: 1300, y: 0 },
  },
  [
    'c.uv > len.value',
    'len.result > mul.a',
    't.time > slow.a',
    'mul.result > sub.a',
    'slow.result > sub.b',
    'sub.result > pal.t',
    'pal.color > out.color',
  ],
)

const polkaDots = graphOf(
  {
    n1: note(0, -190, 'Centered UV keeps pixels square, so circles stay round. Tile then repeats the 0…1 square 6 times in each direction: inside every copy, the position goes from 0 to 1 again.'),
    n2: note(520, -170, 'Circle is 1 inside a circle around the center (0.5, 0.5) of each copy, and 0 outside. Softness blurs the edge.'),
    n3: note(1040, -190, 'Mix uses that mask to choose between two colors: the background where it is 0, the dots where it is 1.'),
    c: { type: 'centered-uv', x: 0, y: 0 },
    tile: { type: 'tile', x: 260, y: 0, values: { count: [6] } },
    circle: { type: 'circle', x: 520, y: 0, values: { radius: [0.3], softness: [0.04] } },
    bg: { type: 'color', x: 780, y: 280, values: { color: [0.96, 0.9, 0.78] } },
    dot: { type: 'color', x: 780, y: 480, values: { color: [0.8, 0.15, 0.25] } },
    mix: { type: 'mix', x: 1040, y: 100 },
    out: { type: 'output', x: 1300, y: 100 },
  },
  [
    'c.uv > tile.position',
    'tile.position > circle.position',
    'bg.color > mix.a',
    'dot.color > mix.b',
    'circle.result > mix.t',
    'mix.result > out.color',
  ],
)

const spotlight = graphOf(
  {
    n1: note(0, -170, 'Time goes through Sin, so it swings between −1 and 1. Scaling it moves the light left and right.'),
    n2: note(780, -170, 'Vec2 packs the swinging X and a fixed Y into a position: the center of the circle.'),
    n3: note(1300, -190, 'Circle with a large Softness fades out gradually, like a spotlight. Mix blends from dark to light with it.'),
    t: { type: 'time', x: 0, y: 300 },
    sin: { type: 'sin', x: 260, y: 300 },
    swing: { type: 'multiply', x: 520, y: 300, values: { b: [0.4] } },
    pos: { type: 'vec2', x: 780, y: 300, values: { y: [0] } },
    c: { type: 'centered-uv', x: 780, y: 0 },
    circle: { type: 'circle', x: 1040, y: 100, values: { radius: [0.25], softness: [0.22] } },
    dark: { type: 'color', x: 1040, y: 440, values: { color: [0.03, 0.03, 0.1] } },
    light: { type: 'color', x: 1040, y: 640, values: { color: [1, 0.9, 0.6] } },
    mix: { type: 'mix', x: 1300, y: 200 },
    out: { type: 'output', x: 1560, y: 200 },
  },
  [
    't.time > sin.x',
    'sin.result > swing.a',
    'swing.result > pos.x',
    'c.uv > circle.position',
    'pos.vector > circle.center',
    'dark.color > mix.a',
    'light.color > mix.b',
    'circle.result > mix.t',
    'mix.result > out.color',
  ],
)

const waves = graphOf(
  {
    n1: note(0, -170, 'Sin of X (scaled by 8) plus time makes a wave that travels. Scaling it by 0.1 keeps it small.'),
    n2: note(780, -170, 'Adding the wave to Y bends every horizontal line. Multiplying by 10 then Fract makes 10 repeating stripes.'),
    n3: note(1300, -190, 'Step turns each stripe into hard black and white: 0 below the edge, 1 above. Mix colors it.'),
    uv: { type: 'uv', x: 0, y: 0 },
    sp: { type: 'split', x: 260, y: 0 },
    fx: { type: 'multiply', x: 520, y: 0, values: { b: [8] } },
    t: { type: 'time', x: 260, y: 340 },
    ft: { type: 'multiply', x: 520, y: 340, values: { b: [2] } },
    ph: { type: 'add', x: 780, y: 100 },
    sin: { type: 'sin', x: 1040, y: 100 },
    amp: { type: 'multiply', x: 1300, y: 100, values: { b: [0.1] } },
    bend: { type: 'add', x: 1560, y: 100 },
    rep: { type: 'multiply', x: 1820, y: 100, values: { b: [10] } },
    fr: { type: 'fract', x: 2080, y: 100 },
    st: { type: 'step', x: 2340, y: 100 },
    a: { type: 'color', x: 2340, y: 400, values: { color: [0.05, 0.15, 0.35] } },
    c: { type: 'color', x: 2340, y: 600, values: { color: [0.4, 0.85, 0.9] } },
    mix: { type: 'mix', x: 2600, y: 200 },
    out: { type: 'output', x: 2860, y: 200 },
  },
  [
    'uv.uv > sp.value',
    'sp.x > fx.a',
    't.time > ft.a',
    'fx.result > ph.a',
    'ft.result > ph.b',
    'ph.result > sin.x',
    'sin.result > amp.a',
    'sp.y > bend.a',
    'amp.result > bend.b',
    'bend.result > rep.a',
    'rep.result > fr.x',
    'fr.result > st.x',
    'a.color > mix.a',
    'c.color > mix.b',
    'st.result > mix.t',
    'mix.result > out.color',
  ],
)

/**
 * Examples are there to be read: every node that can show a preview does (nodes you add
 * yourself start without one, like in Blender).
 */
function withPreviews(graph: Graph): Graph {
  const nodes = Object.fromEntries(
    Object.entries(graph.nodes).map(([id, node]) => {
      const def = getNodeDef(node.type)
      const previewable = def && def.type !== 'output' && def.preview !== 'none'
      return [id, previewable ? { ...node, showPreview: true } : node]
    }),
  )
  return { ...graph, nodes }
}

export const EXAMPLES: Example[] = [
  { id: 'sliding-gradient', name: 'Sliding gradient', description: 'UV, time and a color mix', graph: withPreviews(slidingGradient) },
  { id: 'rings', name: 'Rings', description: 'Distance and waves', graph: withPreviews(rings) },
  { id: 'checkerboard', name: 'Checkerboard', description: 'Floor, mod and rotation', graph: withPreviews(checkerboard) },
  { id: 'clouds', name: 'Clouds', description: 'Animated noise', graph: withPreviews(clouds) },
  { id: 'rainbow', name: 'Rainbow', description: 'Colors from hue, saturation, value', graph: withPreviews(rainbow) },
  { id: 'polka-dots', name: 'Polka dots', description: 'Tile and circle masks', graph: withPreviews(polkaDots) },
  { id: 'spotlight', name: 'Spotlight', description: 'A soft circle that swings', graph: withPreviews(spotlight) },
  { id: 'waves', name: 'Waves', description: 'Sin bends stripes', graph: withPreviews(waves) },
  { id: 'palette-rings', name: 'Palette rings', description: 'A cosine palette on moving rings', graph: withPreviews(paletteRings) },
]

/** What a first-time visitor sees. */
export const DEFAULT_GRAPH: Graph = EXAMPLES[0].graph
