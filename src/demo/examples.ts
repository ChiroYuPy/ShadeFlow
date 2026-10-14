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
  /** Output shown in the node's preview, when it is not the first one. */
  previewPort?: string
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
      ...(s.previewPort !== undefined ? { previewPort: s.previewPort } : {}),
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

/** Cells: Voronoi gives every cell its own value, and how far the pixel is from its middle. */
const cells = graphOf(
  {
    n1: note(0, -190, 'Tiling and Offset slides the space: its Offset is a Vec2 whose X grows with Time, so the whole pattern drifts to the left.'),
    n2: note(780, -190, 'Voronoi cuts the space into cells around scattered points. Cell is a random value per cell, Distance how far the pixel is from its point.'),
    n3: note(1300, -190, 'Each cell gets its color from the Cosine Palette; One Minus of Distance darkens it toward the edges, so the cells look round.'),
    c: { type: 'centered-uv', x: 0, y: 0 },
    time: { type: 'time', x: 0, y: 300 },
    speed: { type: 'multiply', x: 260, y: 300, values: { b: [0.15] } },
    drift: { type: 'vec2', x: 520, y: 300 },
    move: { type: 'tiling-offset', x: 520, y: 0 },
    vor: { type: 'voronoi', x: 780, y: 0, values: { scale: [5] } },
    pal: { type: 'cosine-palette', x: 1040, y: 0, values: { d: [0.1, 0.35, 0.6] } },
    shade: { type: 'one-minus', x: 1040, y: 380 },
    lit: { type: 'multiply', x: 1300, y: 100 },
    out: { type: 'output', x: 1560, y: 100 },
  },
  [
    'time.time > speed.a',
    'speed.result > drift.x',
    'c.uv > move.position',
    'drift.vector > move.offset',
    'move.position > vor.position',
    'vor.cell > pal.t',
    'vor.distance > shade.x',
    'pal.color > lit.a',
    'shade.result > lit.b',
    'lit.result > out.color',
  ],
)

/** Fire: a rising noise, weaker toward the top, turned into colors by a Color Ramp. */
const fire = graphOf(
  {
    n1: note(0, -190, 'Time slides the noise down through Tiling and Offset (a negative speed), so the flames seem to rise.'),
    n2: note(780, -190, 'Split takes the height of the pixel; One Minus of it is 1 at the bottom and 0 at the top. Multiplying the noise by it lets the fire die out as it rises.'),
    n3: note(1300, -190, 'Color Ramp turns that heat into colors: black where it is cold, then red, orange, yellow and white. Click its bar to add a color, drag one to move it.'),
    uv: { type: 'uv', x: 0, y: 0 },
    time: { type: 'time', x: 0, y: 300 },
    speed: { type: 'multiply', x: 260, y: 300, values: { b: [-0.5] } },
    rise: { type: 'vec2', x: 520, y: 300 },
    move: { type: 'tiling-offset', x: 520, y: 0, values: { tiling: [1.5, 1] } },
    noise: { type: 'fractal-noise', x: 780, y: 0, values: { scale: [4] } },
    split: { type: 'split', x: 780, y: 380, previewPort: 'y' },
    fade: { type: 'one-minus', x: 1040, y: 380 },
    heat: { type: 'multiply', x: 1040, y: 0 },
    ramp: {
      type: 'color-ramp',
      x: 1300,
      y: 0,
      values: { stops: [0.12, 0, 0, 0, 0.3, 0.55, 0.04, 0, 0.45, 1, 0.42, 0, 0.6, 1, 0.85, 0.3, 0.75, 1, 1, 0.9] },
    },
    out: { type: 'output', x: 1560, y: 100 },
  },
  [
    'time.time > speed.a',
    'speed.result > rise.y',
    'uv.uv > move.position',
    'rise.vector > move.offset',
    'move.position > noise.position',
    'uv.uv > split.value',
    'split.y > fade.x',
    'noise.result > heat.a',
    'fade.result > heat.b',
    'heat.result > ramp.t',
    'ramp.color > out.color',
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

/** Masks combine like sets: Max is "either", Multiply is "both", One Minus is "not". */
const shapes = graphOf(
  {
    n1: note(0, -190, 'Circle and Rectangle are masks: 1 inside the shape, 0 outside. Max keeps the larger of the two, so the result is 1 inside either: their union.'),
    n2: note(520, -190, 'A star-like pentagon spins: Rotate turns the space before Polygon draws in it. One Minus flips its mask (1 outside), and Multiply keeps what is inside both: a hole.'),
    n3: note(1300, -170, 'Try Multiply instead of Max for the first two shapes: only their overlap is left.'),
    c: { type: 'centered-uv', x: 0, y: 0 },
    circle: { type: 'circle', x: 260, y: 0, values: { center: [-0.12, 0], radius: [0.24], softness: [0.005] } },
    rect: { type: 'rectangle', x: 260, y: 300, values: { center: [0.14, -0.04], size: [0.44, 0.3], softness: [0.005] } },
    union: { type: 'max', x: 520, y: 100 },
    t: { type: 'time', x: 0, y: 640 },
    spin: { type: 'multiply', x: 260, y: 640, values: { b: [0.6] } },
    rot: { type: 'rotate', x: 520, y: 520, values: { center: [0, 0] } },
    poly: { type: 'polygon', x: 780, y: 520, values: { center: [0, 0], radius: [0.09], sides: [5], softness: [0.005] } },
    hole: { type: 'one-minus', x: 1040, y: 520 },
    cut: { type: 'multiply', x: 1040, y: 100 },
    bg: { type: 'color', x: 1040, y: 820, values: { color: [0.93, 0.9, 0.84] } },
    fg: { type: 'color', x: 1040, y: 1000, values: { color: [0.16, 0.36, 0.7] } },
    mix: { type: 'mix', x: 1300, y: 200 },
    out: { type: 'output', x: 1560, y: 200 },
  },
  [
    'c.uv > circle.position',
    'c.uv > rect.position',
    'circle.result > union.a',
    'rect.result > union.b',
    't.time > spin.a',
    'c.uv > rot.position',
    'spin.result > rot.angle',
    'rot.position > poly.position',
    'poly.result > hole.x',
    'union.result > cut.a',
    'hole.result > cut.b',
    'bg.color > mix.a',
    'fg.color > mix.b',
    'cut.result > mix.t',
    'mix.result > out.color',
  ],
)

/** Bricks: every other row slides by half a brick, and each brick gets its own shade. */
const bricks = graphOf(
  {
    n1: note(0, -190, 'Tiling and Offset stretches the space: 3 bricks across, 6 rows up. Floor of Y is the row number; Mod 2 of it is 1 on every other row.'),
    n2: note(780, -190, 'Half a brick is added to X on those rows only. Fract then gives the position inside the brick, Floor the number of the brick.'),
    n3: note(1560, -190, 'Rectangle draws the brick inside each cell, a bit smaller than the cell: the gap is the mortar. Random gives every brick its own shade.'),
    c: { type: 'centered-uv', x: 0, y: 0 },
    scale: { type: 'tiling-offset', x: 260, y: 0, values: { tiling: [3, 6] } },
    sp: { type: 'split', x: 520, y: 0 },
    row: { type: 'floor', x: 780, y: 300 },
    odd: { type: 'mod', x: 1040, y: 300, values: { divisor: [2] } },
    half: { type: 'multiply', x: 1300, y: 300, values: { b: [0.5] } },
    shift: { type: 'add', x: 1300, y: 0 },
    pos: { type: 'vec2', x: 1560, y: 0 },
    inside: { type: 'fract', x: 1820, y: 0 },
    brick: { type: 'floor', x: 1820, y: 300 },
    rnd: { type: 'random', x: 2080, y: 300 },
    shade: { type: 'mix', x: 2340, y: 300, values: { a: [0.65], b: [1.1] } },
    rect: { type: 'rectangle', x: 2080, y: 0, values: { size: [0.94, 0.86], softness: [0.02] } },
    clay: { type: 'color', x: 2340, y: 640, values: { color: [0.68, 0.27, 0.17] } },
    tint: { type: 'multiply', x: 2600, y: 400 },
    mortar: { type: 'color', x: 2600, y: 700, values: { color: [0.8, 0.77, 0.7] } },
    mix: { type: 'mix', x: 2860, y: 200 },
    out: { type: 'output', x: 3120, y: 200 },
  },
  [
    'c.uv > scale.position',
    'scale.position > sp.value',
    'sp.y > row.x',
    'row.result > odd.value',
    'odd.result > half.a',
    'sp.x > shift.a',
    'half.result > shift.b',
    'shift.result > pos.x',
    'sp.y > pos.y',
    'pos.vector > inside.x',
    'pos.vector > brick.x',
    'brick.result > rnd.seed',
    'rnd.result > shade.t',
    'inside.result > rect.position',
    'clay.color > tint.a',
    'shade.result > tint.b',
    'mortar.color > mix.a',
    'tint.result > mix.b',
    'rect.result > mix.t',
    'mix.result > out.color',
  ],
)

/** Truchet tiles: one tile, two arcs, flipped at random, and a maze appears. */
const truchet = graphOf(
  {
    n1: note(0, -190, 'Tile cuts the space into 8 squares a row. Random gives each square a value, and Step turns it into a coin toss: 0 or 1.'),
    n2: note(780, -190, 'When the coin says 1, the square is mirrored: X becomes One Minus X. Mix picks the plain or the mirrored position (T is 0 or 1).'),
    n3: note(1560, -190, 'In each square, two quarter circles join the middles of its sides: their distance to the corners (0, 0) and (1, 1), minus the radius 0.5. Abs makes it the distance to the arc itself, Min keeps the nearest arc.'),
    n4: note(2600, -170, 'Smoothstep draws a line where that distance is small. Since every arc meets the next square\'s, the lines never end.'),
    c: { type: 'centered-uv', x: 0, y: 0 },
    tile: { type: 'tile', x: 260, y: 0, values: { count: [8] } },
    rnd: { type: 'random', x: 520, y: 300 },
    coin: { type: 'step', x: 780, y: 300 },
    sp: { type: 'split', x: 520, y: 0 },
    flipX: { type: 'one-minus', x: 780, y: 0 },
    flipped: { type: 'vec2', x: 1040, y: 0 },
    pick: { type: 'mix', x: 1300, y: 100 },
    d1: { type: 'distance', x: 1560, y: 0, values: { b: [0, 0] } },
    d2: { type: 'distance', x: 1560, y: 300, values: { b: [1, 1] } },
    r1: { type: 'subtract', x: 1820, y: 0, values: { b: [0.5] } },
    r2: { type: 'subtract', x: 1820, y: 300, values: { b: [0.5] } },
    a1: { type: 'abs', x: 2080, y: 0 },
    a2: { type: 'abs', x: 2080, y: 300 },
    near: { type: 'min', x: 2340, y: 100 },
    line: { type: 'smoothstep', x: 2600, y: 100, values: { edge0: [0.07], edge1: [0.11] } },
    ink: { type: 'color', x: 2600, y: 420, values: { color: [0.98, 0.75, 0.25] } },
    paper: { type: 'color', x: 2600, y: 600, values: { color: [0.1, 0.12, 0.2] } },
    mix: { type: 'mix', x: 2860, y: 200 },
    out: { type: 'output', x: 3120, y: 200 },
  },
  [
    'c.uv > tile.position',
    'tile.cell > rnd.seed',
    'rnd.result > coin.x',
    'tile.position > sp.value',
    'sp.x > flipX.x',
    'flipX.result > flipped.x',
    'sp.y > flipped.y',
    'tile.position > pick.a',
    'flipped.vector > pick.b',
    'coin.result > pick.t',
    'pick.result > d1.a',
    'pick.result > d2.a',
    'd1.result > r1.a',
    'd2.result > r2.a',
    'r1.result > a1.x',
    'r2.result > a2.x',
    'a1.result > near.a',
    'a2.result > near.b',
    'near.result > line.x',
    'ink.color > mix.a',
    'paper.color > mix.b',
    'line.result > mix.t',
    'mix.result > out.color',
  ],
)

/** Mouse: a soft circle follows the pointer and lights a dark checkerboard. */
const flashlight = graphOf(
  {
    n1: note(0, -190, 'Mouse gives the pointer\'s position over the result. Its Centered output is in the same space as Centered UV, so it can be the center of a Circle. Move the pointer over the result!'),
    n2: note(520, -190, 'A large Softness makes the circle fade out slowly: a beam of light. Mix turns it into a brightness, from 0.05 in the dark to 1 in the beam.'),
    n3: note(1040, -190, 'The Checkerboard node draws the floor. Multiplying a color by the brightness darkens it: that is all lighting does.'),
    c: { type: 'centered-uv', x: 0, y: 0 },
    mouse: { type: 'mouse', x: 0, y: 300 },
    beam: { type: 'circle', x: 260, y: 100, values: { radius: [0.12], softness: [0.12] } },
    light: { type: 'mix', x: 520, y: 100, values: { a: [0.05], b: [1] } },
    board: { type: 'checkerboard', x: 260, y: 520, values: { count: [6] } },
    a: { type: 'color', x: 520, y: 520, values: { color: [0.85, 0.82, 0.75] } },
    b: { type: 'color', x: 520, y: 700, values: { color: [0.3, 0.4, 0.55] } },
    floor: { type: 'mix', x: 780, y: 520 },
    lit: { type: 'multiply', x: 1040, y: 200 },
    out: { type: 'output', x: 1300, y: 200 },
  },
  [
    'c.uv > beam.position',
    'mouse.centered > beam.center',
    'beam.result > light.t',
    'c.uv > board.position',
    'a.color > floor.a',
    'b.color > floor.b',
    'board.result > floor.t',
    'floor.result > lit.a',
    'light.result > lit.b',
    'lit.result > out.color',
  ],
)

/** Glow: a small number divided by the distance to a line is bright on it and fades around. */
const neon = graphOf(
  {
    n1: note(0, -190, 'Length minus a radius is the distance to a circle: Abs makes it positive on both sides. The radius breathes with Sin of time.'),
    n2: note(1040, -190, '0.006 divided by that distance is huge on the circle and falls off quickly around it: a glow. Multiplying a color by it gives a neon tube; above 1, it turns white.'),
    n3: note(0, 720, 'The same with a wave: the distance from Y to Sin of X. Add puts both lights together, as light adds up.'),
    c: { type: 'centered-uv', x: 0, y: 0 },
    len: { type: 'length', x: 260, y: 0 },
    t: { type: 'time', x: 0, y: 300 },
    pulse: { type: 'sin', x: 260, y: 300 },
    breathe: { type: 'multiply', x: 520, y: 300, values: { b: [0.02] } },
    radius: { type: 'add', x: 780, y: 300, values: { b: [0.26] } },
    ring: { type: 'subtract', x: 780, y: 0 },
    dRing: { type: 'abs', x: 1040, y: 0 },
    gRing: { type: 'divide', x: 1300, y: 0, values: { a: [0.006] } },
    pink: { type: 'color', x: 1300, y: 300, values: { color: [1, 0.2, 0.6] } },
    lRing: { type: 'multiply', x: 1560, y: 0 },
    sp: { type: 'split', x: 260, y: 820 },
    fx: { type: 'multiply', x: 520, y: 820, values: { b: [6] } },
    phase: { type: 'add', x: 780, y: 820 },
    wave: { type: 'sin', x: 1040, y: 820 },
    amp: { type: 'multiply', x: 1300, y: 820, values: { b: [0.08] } },
    off: { type: 'subtract', x: 1560, y: 820 },
    dWave: { type: 'abs', x: 1820, y: 820 },
    gWave: { type: 'divide', x: 2080, y: 820, values: { a: [0.004] } },
    cyan: { type: 'color', x: 2080, y: 1120, values: { color: [0.2, 0.75, 1] } },
    lWave: { type: 'multiply', x: 2340, y: 820 },
    sum: { type: 'add', x: 2600, y: 300 },
    out: { type: 'output', x: 2860, y: 300 },
  },
  [
    'c.uv > len.value',
    't.time > pulse.x',
    'pulse.result > breathe.a',
    'breathe.result > radius.a',
    'len.result > ring.a',
    'radius.result > ring.b',
    'ring.result > dRing.x',
    'dRing.result > gRing.b',
    'pink.color > lRing.a',
    'gRing.result > lRing.b',
    'c.uv > sp.value',
    'sp.x > fx.a',
    'fx.result > phase.a',
    't.time > phase.b',
    'phase.result > wave.x',
    'wave.result > amp.a',
    'sp.y > off.a',
    'amp.result > off.b',
    'off.result > dWave.x',
    'dWave.result > gWave.b',
    'cyan.color > lWave.a',
    'gWave.result > lWave.b',
    'lRing.result > sum.a',
    'lWave.result > sum.b',
    'sum.result > out.color',
  ],
)

/** Metaballs: the glows of a few points add up, and a threshold makes them merge like drops. */
const metaballs = graphOf(
  {
    n1: note(0, -190, 'Two centers move with Sin and Cos of time; the third one is the pointer (Mouse). Move it over the result, close to the others.'),
    n2: note(1040, -190, 'For each center, 0.05 divided by the distance: large near it, small far away. Added together, the values of close centers merge into one field.'),
    n3: note(1820, -190, 'Color Ramp draws that field: a sharp step at 0.6 gives the outline of the blobs, the soft part below it their glow.'),
    c: { type: 'centered-uv', x: 780, y: 0 },
    t: { type: 'time', x: 0, y: 300 },
    s: { type: 'sin', x: 260, y: 300 },
    sx: { type: 'multiply', x: 520, y: 300, values: { b: [0.35] } },
    p1: { type: 'vec2', x: 780, y: 300, values: { y: [0.05] } },
    slow: { type: 'multiply', x: 0, y: 600, values: { b: [0.7] } },
    k: { type: 'cos', x: 260, y: 600 },
    ky: { type: 'multiply', x: 520, y: 600, values: { b: [0.22] } },
    p2: { type: 'vec2', x: 780, y: 600, values: { x: [-0.05] } },
    mouse: { type: 'mouse', x: 780, y: 900 },
    d1: { type: 'distance', x: 1040, y: 200 },
    d2: { type: 'distance', x: 1040, y: 500 },
    d3: { type: 'distance', x: 1040, y: 800 },
    f1: { type: 'divide', x: 1300, y: 200, values: { a: [0.05] } },
    f2: { type: 'divide', x: 1300, y: 500, values: { a: [0.05] } },
    f3: { type: 'divide', x: 1300, y: 800, values: { a: [0.05] } },
    s12: { type: 'add', x: 1560, y: 300 },
    field: { type: 'add', x: 1820, y: 400 },
    ramp: {
      type: 'color-ramp',
      x: 2080,
      y: 300,
      values: { stops: [0, 0.02, 0.02, 0.06, 0.58, 0.25, 0.08, 0.45, 0.6, 1, 0.45, 0.35, 1, 1, 0.9, 0.6] },
    },
    out: { type: 'output', x: 2340, y: 300 },
  },
  [
    't.time > s.x',
    's.result > sx.a',
    'sx.result > p1.x',
    't.time > slow.a',
    'slow.result > k.x',
    'k.result > ky.a',
    'ky.result > p2.y',
    'c.uv > d1.a',
    'p1.vector > d1.b',
    'c.uv > d2.a',
    'p2.vector > d2.b',
    'c.uv > d3.a',
    'mouse.centered > d3.b',
    'd1.result > f1.b',
    'd2.result > f2.b',
    'd3.result > f3.b',
    'f1.result > s12.a',
    'f2.result > s12.b',
    's12.result > field.a',
    'f3.result > field.b',
    'field.result > ramp.t',
    'ramp.color > out.color',
  ],
)

/** A 3D ball, from 2D: its surface direction, lit by the pointer. */
const litSphere = graphOf(
  {
    n1: note(0, -230, 'Inside a circle of radius 1, a ball\'s surface comes toward us by Z = √(1 − x² − y²). Dot of the position with itself is x² + y²; One Minus, Saturate (no negative under the root) and Square Root give Z.'),
    n2: note(1300, -230, 'Vec3 of X, Y and Z is the normal: the direction the surface faces. The light comes from the pointer (Mouse), toward the screen; Normalize gives that direction a length of 1.'),
    n3: note(2080, -230, 'Dot of the normal and the light is 1 where the surface faces the light and falls to 0 at a right angle: diffuse lighting. Max keeps a little ambient light; a high Power of it adds a shiny highlight.'),
    c: { type: 'centered-uv', x: 0, y: 0 },
    scale: { type: 'multiply', x: 260, y: 0, values: { b: [2.4] } },
    sq: { type: 'dot', x: 520, y: 0 },
    inv: { type: 'one-minus', x: 780, y: 0 },
    sat: { type: 'saturate', x: 1040, y: 0 },
    z: { type: 'sqrt', x: 1300, y: 0 },
    sp: { type: 'split', x: 1040, y: 300 },
    normal: { type: 'vec3', x: 1560, y: 100 },
    mouse: { type: 'mouse', x: 780, y: 640 },
    mscale: { type: 'multiply', x: 1040, y: 640, values: { b: [2.4] } },
    msp: { type: 'split', x: 1300, y: 640 },
    toward: { type: 'vec3', x: 1560, y: 640, values: { z: [1] } },
    light: { type: 'normalize', x: 1820, y: 640 },
    facing: { type: 'dot', x: 2080, y: 200 },
    diffuse: { type: 'max', x: 2340, y: 200, values: { b: [0.06] } },
    paint: { type: 'color', x: 2340, y: 520, values: { color: [0.95, 0.42, 0.18] } },
    shade: { type: 'multiply', x: 2600, y: 200 },
    shine: { type: 'pow', x: 2600, y: 520, values: { exponent: [40] } },
    lit: { type: 'add', x: 2860, y: 300 },
    ball: { type: 'circle', x: 2860, y: 600, values: { center: [0, 0], radius: [1], softness: [0.01] } },
    bg: { type: 'color', x: 2860, y: 900, values: { color: [0.08, 0.09, 0.13] } },
    mix: { type: 'mix', x: 3120, y: 400 },
    out: { type: 'output', x: 3380, y: 400 },
  },
  [
    'c.uv > scale.a',
    'scale.result > sq.a',
    'scale.result > sq.b',
    'sq.result > inv.x',
    'inv.result > sat.x',
    'sat.result > z.x',
    'scale.result > sp.value',
    'sp.x > normal.x',
    'sp.y > normal.y',
    'z.result > normal.z',
    'mouse.centered > mscale.a',
    'mscale.result > msp.value',
    'msp.x > toward.x',
    'msp.y > toward.y',
    'toward.vector > light.value',
    'normal.vector > facing.a',
    'light.result > facing.b',
    'facing.result > diffuse.a',
    'paint.color > shade.a',
    'diffuse.result > shade.b',
    'diffuse.result > shine.base',
    'shade.result > lit.a',
    'shine.result > lit.b',
    'scale.result > ball.position',
    'bg.color > mix.a',
    'lit.result > mix.b',
    'ball.result > mix.t',
    'mix.result > out.color',
  ],
)

/** Pixels and posterize: Floor makes steps of the position, then of the color. */
const pixels = graphOf(
  {
    n1: note(0, -190, 'Resolution is the size of the picture in pixels. Divided by 12, it is the number of big blocks of 12 pixels that fit across and up.'),
    n2: note(520, -190, 'UV times that number, Floor, then divided back: every pixel of a block gets the position of its corner. The space is made of steps.'),
    n3: note(1300, -190, 'The noise drawn with that position is blocky. Floor again, this time of the value (times 4, then divided by 4), keeps 4 levels only: that is posterizing.'),
    n4: note(2600, -170, 'Color Ramp gives each level its color: the four greens of an old Game Boy.'),
    uv: { type: 'uv', x: 0, y: 0 },
    res: { type: 'resolution', x: 0, y: 300 },
    blocks: { type: 'divide', x: 260, y: 300, values: { b: [12] } },
    up: { type: 'multiply', x: 520, y: 0 },
    steps: { type: 'floor', x: 780, y: 0 },
    back: { type: 'divide', x: 1040, y: 0 },
    t: { type: 'time', x: 780, y: 300 },
    slow: { type: 'multiply', x: 1040, y: 300, values: { b: [0.05] } },
    drift: { type: 'add', x: 1300, y: 0 },
    nz: { type: 'noise', x: 1560, y: 0, values: { scale: [4] } },
    levels: { type: 'multiply', x: 1820, y: 0, values: { b: [4] } },
    poster: { type: 'floor', x: 2080, y: 0 },
    down: { type: 'divide', x: 2340, y: 0, values: { b: [4] } },
    ramp: {
      type: 'color-ramp',
      x: 2600,
      y: 0,
      values: { stops: [0.25, 0.06, 0.22, 0.06, 0.5, 0.19, 0.38, 0.19, 0.75, 0.55, 0.67, 0.06, 1, 0.61, 0.74, 0.06] },
    },
    out: { type: 'output', x: 2860, y: 0 },
  },
  [
    'res.resolution > blocks.a',
    'uv.uv > up.a',
    'blocks.result > up.b',
    'up.result > steps.x',
    'steps.result > back.a',
    'blocks.result > back.b',
    't.time > slow.a',
    'back.result > drift.a',
    'slow.result > drift.b',
    'drift.result > nz.position',
    'nz.result > levels.a',
    'levels.result > poster.x',
    'poster.result > down.a',
    'down.result > ramp.t',
    'ramp.color > out.color',
  ],
)

/** Kaleidoscope: fold the angle around the center, then draw anything with the folded space. */
const kaleidoscope = graphOf(
  {
    n1: note(0, -230, 'Polar gives the Angle around the center (0 to 1 for a full turn). Times 6 and Fract: 6 slices, each going 0 → 1. Minus 0.5 and Abs: each slice is mirrored around its middle.'),
    n2: note(1560, -230, 'The folded angle (times 1.047, a sixth of a turn in radians) turns a point at the pixel\'s distance from the center: Rotate rebuilds a position, now the same in every slice.'),
    n3: note(2340, -190, 'Whatever is drawn with that position is repeated 12 times, mirror after mirror. Here a drifting Fractal Noise through a Cosine Palette.'),
    c: { type: 'centered-uv', x: 0, y: 0 },
    polar: { type: 'polar', x: 260, y: 0, values: { center: [0, 0] } },
    slices: { type: 'multiply', x: 520, y: 0, values: { b: [6] } },
    fr: { type: 'fract', x: 780, y: 0 },
    mid: { type: 'subtract', x: 1040, y: 0, values: { b: [0.5] } },
    fold: { type: 'abs', x: 1300, y: 0 },
    rad: { type: 'multiply', x: 1560, y: 0, values: { b: [1.047] } },
    point: { type: 'vec2', x: 1560, y: 300 },
    rot: { type: 'rotate', x: 1820, y: 100, values: { center: [0, 0] } },
    t: { type: 'time', x: 1820, y: 500 },
    slow: { type: 'multiply', x: 2080, y: 500, values: { b: [0.08] } },
    drift: { type: 'add', x: 2080, y: 100 },
    nz: { type: 'fractal-noise', x: 2340, y: 100, values: { scale: [3], detail: [4] } },
    pal: { type: 'cosine-palette', x: 2600, y: 100, values: { c: [1.2, 1.2, 1.2], d: [0, 0.15, 0.3] } },
    out: { type: 'output', x: 2860, y: 100 },
  },
  [
    'c.uv > polar.position',
    'polar.angle > slices.a',
    'slices.result > fr.x',
    'fr.result > mid.a',
    'mid.result > fold.x',
    'fold.result > rad.a',
    'polar.radius > point.x',
    'point.vector > rot.position',
    'rad.result > rot.angle',
    't.time > slow.a',
    'rot.position > drift.a',
    'slow.result > drift.b',
    'drift.result > nz.position',
    'nz.result > pal.t',
    'pal.color > out.color',
  ],
)

/** A floor that goes to the horizon: divide by the height to fake perspective. */
const infiniteFloor = graphOf(
  {
    n1: note(0, -230, 'Below the horizon (a little above the middle), the closer a pixel is to it, the farther away the floor. 1 divided by the height below the horizon is that depth: it grows without end toward the horizon.'),
    n2: note(1040, -230, 'X multiplied by the depth spreads the floor apart as it comes closer; depth plus time slides it toward us. Vec2 of both is a position on the floor.'),
    n3: note(1820, -230, 'Checkerboard draws tiles on it. Fog hides the tiny, flickering tiles near the horizon: the floor color fades into the sky as the height gets small. Above the horizon it is all sky.'),
    c: { type: 'centered-uv', x: 0, y: 0 },
    sp: { type: 'split', x: 260, y: 0 },
    below: { type: 'subtract', x: 520, y: 100, values: { a: [0.08] } },
    depth: { type: 'divide', x: 780, y: 100, values: { a: [0.5] } },
    across: { type: 'multiply', x: 1040, y: 0 },
    t: { type: 'time', x: 780, y: 400 },
    speed: { type: 'multiply', x: 1040, y: 400, values: { b: [1.5] } },
    ahead: { type: 'add', x: 1040, y: 200 },
    floorPos: { type: 'vec2', x: 1300, y: 100 },
    tiles: { type: 'checkerboard', x: 1560, y: 100, values: { count: [1] } },
    a: { type: 'color', x: 1560, y: 420, values: { color: [0.95, 0.3, 0.7] } },
    b: { type: 'color', x: 1560, y: 600, values: { color: [0.12, 0.05, 0.3] } },
    ground: { type: 'mix', x: 1820, y: 100 },
    thick: { type: 'multiply', x: 1820, y: 700, values: { b: [5] } },
    fog: { type: 'saturate', x: 2080, y: 700 },
    sky: { type: 'color', x: 2080, y: 400, values: { color: [0.35, 0.15, 0.45] } },
    mix: { type: 'mix', x: 2340, y: 200 },
    out: { type: 'output', x: 2600, y: 200 },
  },
  [
    'c.uv > sp.value',
    'sp.y > below.b',
    'below.result > depth.b',
    'sp.x > across.a',
    'depth.result > across.b',
    't.time > speed.a',
    'depth.result > ahead.a',
    'speed.result > ahead.b',
    'across.result > floorPos.x',
    'ahead.result > floorPos.y',
    'floorPos.vector > tiles.position',
    'a.color > ground.a',
    'b.color > ground.b',
    'tiles.result > ground.t',
    'below.result > thick.a',
    'thick.result > fog.x',
    'sky.color > mix.a',
    'ground.result > mix.b',
    'fog.result > mix.t',
    'mix.result > out.color',
  ],
)

/** An island: noise for the relief, lower toward the edges, colored by height. */
const island = graphOf(
  {
    n1: note(0, -190, 'Fractal Noise is a relief: hills and valleys. Subtracting the distance from the center lowers it toward the edges, so the land ends in the sea.'),
    n2: note(780, -190, 'The result is a height. Color Ramp paints it like a map: deep and shallow water, a thin beach, grass, forest, rock and snow on the peaks. Move its colors to raise the sea!'),
    c: { type: 'centered-uv', x: 0, y: 0 },
    relief: { type: 'fractal-noise', x: 260, y: 0, values: { scale: [3], detail: [6] } },
    len: { type: 'length', x: 260, y: 400 },
    slope: { type: 'multiply', x: 520, y: 400, values: { b: [1.3] } },
    height: { type: 'subtract', x: 520, y: 0 },
    lift: { type: 'add', x: 780, y: 0, values: { b: [0.28] } },
    ramp: {
      type: 'color-ramp',
      x: 1040,
      y: 0,
      values: {
        stops: [
          0.2, 0.03, 0.1, 0.3,
          0.42, 0.1, 0.42, 0.62,
          0.45, 0.9, 0.84, 0.6,
          0.48, 0.35, 0.6, 0.22,
          0.6, 0.12, 0.36, 0.14,
          0.7, 0.42, 0.38, 0.34,
          0.78, 0.98, 0.98, 1,
        ],
      },
    },
    out: { type: 'output', x: 1300, y: 0 },
  },
  [
    'c.uv > relief.position',
    'c.uv > len.value',
    'len.result > slope.a',
    'relief.result > height.a',
    'slope.result > height.b',
    'height.result > lift.a',
    'lift.result > ramp.t',
    'ramp.color > out.color',
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
  { id: 'rainbow', name: 'Rainbow', description: 'Colors from hue, saturation, value', graph: withPreviews(rainbow) },
  { id: 'shapes', name: 'Shapes', description: 'Masks combined: union and hole', graph: withPreviews(shapes) },
  { id: 'rings', name: 'Rings', description: 'Distance and waves', graph: withPreviews(rings) },
  { id: 'waves', name: 'Waves', description: 'Sin bends stripes', graph: withPreviews(waves) },
  { id: 'checkerboard', name: 'Checkerboard', description: 'Floor, mod and rotation', graph: withPreviews(checkerboard) },
  { id: 'sunburst', name: 'Sunburst', description: 'Rays from polar coordinates', graph: withPreviews(sunburst) },
  { id: 'confetti', name: 'Confetti', description: 'A random color for every tile', graph: withPreviews(confetti) },
  { id: 'bricks', name: 'Bricks', description: 'Shifted rows and a shade per brick', graph: withPreviews(bricks) },
  { id: 'truchet', name: 'Maze', description: 'Random tiles that join up (Truchet)', graph: withPreviews(truchet) },
  { id: 'flashlight', name: 'Flashlight', description: 'A light that follows the pointer', graph: withPreviews(flashlight) },
  { id: 'neon', name: 'Neon', description: 'Glow: a number over a distance', graph: withPreviews(neon) },
  { id: 'metaballs', name: 'Metaballs', description: 'Glows that add up and merge', graph: withPreviews(metaballs) },
  { id: 'lit-sphere', name: 'Lit sphere', description: 'A 3D ball lit from the pointer', graph: withPreviews(litSphere) },
  { id: 'pixels', name: 'Pixels', description: 'Pixelate and posterize with Floor', graph: withPreviews(pixels) },
  { id: 'kaleidoscope', name: 'Kaleidoscope', description: 'Space folded into mirrored slices', graph: withPreviews(kaleidoscope) },
  { id: 'infinite-floor', name: 'Infinite floor', description: 'Perspective from a division', graph: withPreviews(infiniteFloor) },
  { id: 'fisheye', name: 'Fisheye', description: 'A pattern seen through a bulging lens', graph: withPreviews(fisheyeDots) },
  { id: 'clouds', name: 'Clouds', description: 'Animated noise', graph: withPreviews(clouds) },
  { id: 'island', name: 'Island', description: 'A height map painted by a color ramp', graph: withPreviews(island) },
  { id: 'fire', name: 'Fire', description: 'Rising noise through a color ramp', graph: withPreviews(fire) },
  { id: 'cells', name: 'Cells', description: 'Voronoi, a palette and a slow drift', graph: withPreviews(cells) },
]

/** What a first-time visitor sees. */
export const DEFAULT_GRAPH: Graph = withPreviews(slidingGradient)
