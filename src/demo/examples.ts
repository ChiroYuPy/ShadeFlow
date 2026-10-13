import { compileGraph, getNodeDef, type Graph, type GraphEdge, type GraphNode } from '@/core'
import { previewKindOf } from '@/render/previewValue'

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
 * Rows of the examples are written about 300 apart, which fits nodes without a preview.
 * A square preview makes a node much taller: everything below the first row is spread out.
 */
const ROW_STRETCH = 1.5

/**
 * Compact way to write a graph: nodes by id, wires as `"from.port > to.port"`.
 */
function graphOf(specs: Record<string, NodeSpec>, wires: string[]): Graph {
  const nodes: Record<string, GraphNode> = {}
  for (const [id, s] of Object.entries(specs)) {
    nodes[id] = {
      id,
      type: s.type,
      position: { x: s.x, y: s.y > 0 ? Math.round(s.y * ROW_STRETCH) : s.y },
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
    colorA: { type: 'color', x: 720, y: 360, values: { color: [0.1, 0.15, 0.6] } },
    colorB: { type: 'color', x: 720, y: 500, values: { color: [1, 0.55, 0.2] } },
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
    n2: note(520, -170, 'Rotate spins the whole grid by an angle that grows with time, around the Center: (0, 0), the middle of the screen with Centered UV.'),
    n3: note(1040, -190, 'Floor keeps the cell number (0, 1, 2…) of X and Y. Adding them and taking Mod 2 alternates 0 and 1, like a checkerboard.'),
    c: { type: 'centered-uv', x: 0, y: 0 },
    sc: { type: 'multiply', x: 260, y: 0, values: { b: [6] } },
    t: { type: 'time', x: 0, y: 300 },
    ang: { type: 'multiply', x: 260, y: 300, values: { b: [0.3] } },
    rot: { type: 'rotate', x: 520, y: 0, values: { center: [0, 0] } },
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
    n1: note(260, -200, 'Time, added to both X and Y of the position, slowly drifts the cloud field.'),
    n2: note(780, -250, 'Fractal Noise stacks 5 layers (Detail) of Noise, each twice as detailed and weaker than the last. That is what makes blobs look like real clouds. Scale sets their size.'),
    n3: note(1300, -250, 'Smoothstep keeps only the dense part of the noise as a cloud mask: 0 is clear sky, 1 is full cloud.'),
    n4: note(0, 720, 'UV Y, from 0 at the bottom to 1 at the top, mixes a pale horizon into a deeper blue.'),
    n5: note(1820, 500, 'Dense cores get a bluish shadow, thin edges stay white. A last Mix puts the clouds over the sky.'),
    c: { type: 'centered-uv', x: 260, y: 0 },
    t: { type: 'time', x: 0, y: 300 },
    slow: { type: 'multiply', x: 260, y: 300, values: { b: [0.012] } },
    off: { type: 'add', x: 520, y: 80 },
    fbm: { type: 'fractal-noise', x: 780, y: 80, values: { scale: [3.5] } },
    mask: { type: 'smoothstep', x: 1040, y: 0, values: { edge0: [0.38], edge1: [0.62] } },
    core: { type: 'smoothstep', x: 1040, y: 280, values: { edge0: [0.55], edge1: [0.85] } },
    uv: { type: 'uv', x: 0, y: 800 },
    sp: { type: 'split', x: 260, y: 800 },
    horizon: { type: 'color', x: 520, y: 1000, values: { color: [0.75, 0.88, 0.98] } },
    zenith: { type: 'color', x: 520, y: 1200, values: { color: [0.12, 0.35, 0.78] } },
    sky: { type: 'mix', x: 780, y: 840 },
    white: { type: 'color', x: 1040, y: 560, values: { color: [1, 1, 1] } },
    shade: { type: 'color', x: 1040, y: 760, values: { color: [0.52, 0.6, 0.78] } },
    tone: { type: 'mix', x: 1300, y: 600 },
    final: { type: 'mix', x: 1560, y: 360 },
    out: { type: 'output', x: 1820, y: 360 },
  },
  [
    'c.uv > off.a',
    't.time > slow.a',
    'slow.result > off.b',
    'off.result > fbm.position',
    'fbm.result > mask.x',
    'fbm.result > core.x',
    'uv.uv > sp.value',
    'horizon.color > sky.a',
    'zenith.color > sky.b',
    'sp.y > sky.t',
    'white.color > tone.a',
    'shade.color > tone.b',
    'core.result > tone.t',
    'sky.result > final.a',
    'tone.result > final.b',
    'mask.result > final.t',
    'final.result > out.color',
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

/** Polar: the angle around the center, repeated, becomes rays. */
const sunburst = graphOf(
  {
    n1: note(0, -190, 'Polar describes each pixel by its Radius (distance from the center) and its Angle, which goes from 0 to 1 around the center.'),
    n2: note(520, -170, 'Adding time turns the angle, multiplying by 12 then Fract repeats it: 12 slices, each going from 0 to 1.'),
    n3: note(1300, -190, 'Step splits each slice in two halves, and Mix colors them: rays!'),
    polar: { type: 'polar', x: 0, y: 0 },
    t: { type: 'time', x: 0, y: 320 },
    slow: { type: 'multiply', x: 260, y: 320, values: { b: [0.03] } },
    turn: { type: 'add', x: 520, y: 100 },
    slices: { type: 'multiply', x: 780, y: 100, values: { b: [12] } },
    fr: { type: 'fract', x: 1040, y: 100 },
    st: { type: 'step', x: 1300, y: 100 },
    a: { type: 'color', x: 1300, y: 380, values: { color: [1, 0.78, 0.2] } },
    c: { type: 'color', x: 1300, y: 580, values: { color: [0.95, 0.45, 0.1] } },
    mix: { type: 'mix', x: 1560, y: 200 },
    out: { type: 'output', x: 1820, y: 200 },
  },
  [
    'polar.angle > turn.a',
    't.time > slow.a',
    'slow.result > turn.b',
    'turn.result > slices.a',
    'slices.result > fr.x',
    'fr.result > st.x',
    'a.color > mix.a',
    'c.color > mix.b',
    'st.result > mix.t',
    'mix.result > out.color',
  ],
)

/** Tile + Random: every copy gets its own color. */
const confetti = graphOf(
  {
    n1: note(0, -190, 'Tile repeats the space 5 times. Besides the position inside each copy, it gives Cell: the number of the copy the pixel is in.'),
    n2: note(520, -190, 'Random turns that number into a value between 0 and 1: one value for each copy, with no pattern.'),
    n3: note(1040, -190, 'The random value is used as a Hue, so every copy gets its own color. Multiplying by a Circle mask keeps a dot of it.'),
    c: { type: 'centered-uv', x: 0, y: 0 },
    tile: { type: 'tile', x: 260, y: 0, values: { count: [5] } },
    rnd: { type: 'random', x: 520, y: 0 },
    hsv: { type: 'hsv', x: 780, y: 0, values: { saturation: [0.75] } },
    circle: { type: 'circle', x: 520, y: 300, values: { radius: [0.36], softness: [0.03] } },
    dots: { type: 'multiply', x: 1040, y: 100 },
    out: { type: 'output', x: 1300, y: 100 },
  },
  [
    'c.uv > tile.position',
    'tile.cell > rnd.seed',
    'rnd.result > hsv.hue',
    'tile.position > circle.position',
    'hsv.color > dots.a',
    'circle.result > dots.b',
    'dots.result > out.color',
  ],
)

/** Fisheye: bend the space first, then draw a regular pattern with it. */
const fisheyeDots = graphOf(
  {
    n1: note(0, -190, 'Centered UV puts (0, 0) in the middle of the screen. Fisheye pushes every position away from that center, a little near it and a lot far from it.'),
    n2: note(520, -190, 'Tile and Circle draw plain rows of dots, but with the bent positions: the dots bulge in the middle and crowd toward the edges.'),
    n3: note(1040, -170, 'Try a negative Strength in Fisheye: the pattern is pinched instead.'),
    c: { type: 'centered-uv', x: 0, y: 0 },
    lens: { type: 'fisheye', x: 260, y: 0, values: { center: [0, 0], strength: [2.5] } },
    tile: { type: 'tile', x: 520, y: 0, values: { count: [5] } },
    circle: { type: 'circle', x: 780, y: 0, values: { radius: [0.32], softness: [0.04] } },
    bg: { type: 'color', x: 1040, y: 380, values: { color: [0.06, 0.08, 0.2] } },
    dot: { type: 'color', x: 1040, y: 500, values: { color: [0.35, 0.85, 0.95] } },
    mix: { type: 'mix', x: 1300, y: 100 },
    out: { type: 'output', x: 1560, y: 100 },
  },
  [
    'c.uv > lens.position',
    'lens.position > tile.position',
    'tile.position > circle.position',
    'bg.color > mix.a',
    'dot.color > mix.b',
    'circle.result > mix.t',
    'mix.result > out.color',
  ],
)

/**
 * The showpiece: a domain-warped palette. Noise bends the space, distance from the center
 * becomes a color through a cosine palette, and a vignette darkens the corners.
 */
const liquidMarble = graphOf(
  {
    n1: note(260, -190, 'Centered UV, nudged by time, feeds the Noise: a slowly drifting field of smooth random blobs. Scale sets their size.'),
    n2: note(780, -190, 'The noise bends the space: it is added to the position before measuring the distance from the center. That is domain warping.'),
    n3: note(1560, -240, 'Distance + noise − time goes through a Cosine Palette: one number becomes a smooth color. Try editing D!'),
    n4: note(260, 1070, 'Smoothstep turns the distance from the center into a mask, One Minus flips it, and Multiply darkens the corners: a vignette.'),
    c: { type: 'centered-uv', x: 0, y: 0 },
    t: { type: 'time', x: 0, y: 330 },
    drift: { type: 'multiply', x: 260, y: 330, values: { b: [0.05] } },
    off: { type: 'add', x: 520, y: 60 },
    nz: { type: 'noise', x: 780, y: 60, values: { scale: [3] } },
    twice: { type: 'multiply', x: 260, y: 600, values: { b: [2] } },
    bend: { type: 'multiply', x: 1040, y: 60, values: { b: [0.6] } },
    warp: { type: 'add', x: 1040, y: 330 },
    len: { type: 'length', x: 1300, y: 330 },
    rings: { type: 'multiply', x: 1560, y: 330, values: { b: [0.7] } },
    sum: { type: 'add', x: 1820, y: 200 },
    slow: { type: 'multiply', x: 1560, y: 600, values: { b: [0.05] } },
    flow: { type: 'subtract', x: 2080, y: 200 },
    pal: {
      type: 'cosine-palette',
      x: 2340,
      y: 100,
      values: { a: [0.5, 0.5, 0.5], b: [0.5, 0.5, 0.5], c: [0.6, 0.6, 0.6], d: [0, 0.15, 0.3] },
    },
    clen: { type: 'length', x: 260, y: 860 },
    edge: { type: 'smoothstep', x: 520, y: 860, values: { edge0: [0.35], edge1: [1] } },
    inv: { type: 'one-minus', x: 780, y: 860 },
    dim: { type: 'multiply', x: 2600, y: 300 },
    out: { type: 'output', x: 2860, y: 300 },
  },
  [
    'c.uv > off.a',
    't.time > drift.a',
    'drift.result > off.b',
    'off.result > nz.position',
    'c.uv > twice.a',
    'nz.result > bend.a',
    'twice.result > warp.a',
    'bend.result > warp.b',
    'warp.result > len.value',
    'len.result > rings.a',
    'rings.result > sum.a',
    'nz.result > sum.b',
    't.time > slow.a',
    'sum.result > flow.a',
    'slow.result > flow.b',
    'flow.result > pal.t',
    'c.uv > clen.value',
    'clen.result > edge.x',
    'edge.result > inv.x',
    'pal.color > dim.a',
    'inv.result > dim.b',
    'dim.result > out.color',
  ],
)

/**
 * Examples are there to be read: every node whose result is a picture shows it (nodes you add
 * yourself start without a preview, like in Blender). Nodes that hold a single number or color
 * would only repeat it.
 */
function withPreviews(graph: Graph): Graph {
  const nodes = Object.fromEntries(
    Object.entries(graph.nodes).map(([id, node]) => {
      const def = getNodeDef(node.type)
      if (!def || def.type === 'output' || def.preview === 'none') return [id, node]
      const result = compileGraph(graph, { root: { nodeId: id, port: def.outputs[0].name } })
      const picture = result.ok && previewKindOf(result.ir) === 'image'
      return [id, picture ? { ...node, showPreview: true } : node]
    }),
  )
  return { ...graph, nodes }
}

export const EXAMPLES: Example[] = [
  { id: 'liquid-marble', name: 'Liquid marble', description: 'Noise-warped space and a color palette', graph: withPreviews(liquidMarble) },
  { id: 'sliding-gradient', name: 'Sliding gradient', description: 'UV, time and a color mix', graph: withPreviews(slidingGradient) },
  { id: 'rings', name: 'Rings', description: 'Distance and waves', graph: withPreviews(rings) },
  { id: 'checkerboard', name: 'Checkerboard', description: 'Floor, mod and rotation', graph: withPreviews(checkerboard) },
  { id: 'clouds', name: 'Clouds', description: 'Animated noise', graph: withPreviews(clouds) },
  { id: 'rainbow', name: 'Rainbow', description: 'Colors from hue, saturation, value', graph: withPreviews(rainbow) },
  { id: 'polka-dots', name: 'Polka dots', description: 'Tile and circle masks', graph: withPreviews(polkaDots) },
  { id: 'confetti', name: 'Confetti', description: 'A random color for every tile', graph: withPreviews(confetti) },
  { id: 'sunburst', name: 'Sunburst', description: 'Rays from polar coordinates', graph: withPreviews(sunburst) },
  { id: 'fisheye', name: 'Fisheye', description: 'A pattern seen through a bulging lens', graph: withPreviews(fisheyeDots) },
  { id: 'spotlight', name: 'Spotlight', description: 'A soft circle that swings', graph: withPreviews(spotlight) },
  { id: 'waves', name: 'Waves', description: 'Sin bends stripes', graph: withPreviews(waves) },
  { id: 'palette-rings', name: 'Palette rings', description: 'A cosine palette on moving rings', graph: withPreviews(paletteRings) },
]

/** What a first-time visitor sees. */
export const DEFAULT_GRAPH: Graph = withPreviews(slidingGradient)
