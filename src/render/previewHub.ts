import {
  compatiblePort,
  compileGraph,
  concreteType,
  evaluate,
  generateGLSL,
  getNodeDef,
  NOTE_TYPE,
  resolveGenTypes,
  sameShader,
  type Graph,
  type IRModule,
  type ValueType,
} from '@/core'
import { useGraphStore } from '@/store/graphStore'
import { compileShader, linkProgram, VERTEX_SOURCE } from './gl'
import { getMainSize } from './mainSize'
import { describeValue, previewKindOf, usesInput, type PreviewKind } from './previewValue'

/**
 * Live previews of nodes, in two flavours (see `PreviewKind`):
 *
 * - **image**: browsers cap the number of WebGL contexts per page (~16), so all image
 *   previews share ONE offscreen context: each frame, every visible preview is drawn
 *   there and copied into its own 2D canvas. Programs are cached by GLSL source, so
 *   moving nodes never recompiles anything, and previews that do not depend on time
 *   are drawn once.
 * - **value**: nodes that do not vary across the screen show their number. It is computed
 *   on the CPU (`evaluate`) — no GPU involved.
 */

export const PREVIEW_WIDTH = 384
export const PREVIEW_HEIGHT = 128

/** What the compiler found out about one previewed output. */
interface Analysis {
  kind: PreviewKind
  /** For `image`. */
  glsl: string | null
  /** For `value`. */
  ir: IRModule | null
  type: ValueType
  /** Depends on time: must be redrawn every frame. */
  animated: boolean
}

const NONE: Analysis = { kind: 'none', glsl: null, ir: null, type: 'float', animated: false }

interface ImageEntry {
  ctx: CanvasRenderingContext2D
  visible: boolean
  /** Source last drawn on the canvas (`undefined` = never drawn). */
  drawn: string | null | undefined
}

interface ValueEntry {
  el: HTMLElement
  visible: boolean
  drawn: Analysis | undefined
  text: string
}

interface Program {
  program: WebGLProgram
  resolution: WebGLUniformLocation | null
  time: WebGLUniformLocation | null
}

class PreviewHub {
  private images = new Map<string, ImageEntry>()
  private values = new Map<string, ValueEntry>()
  private elementToId = new Map<Element, string>()
  /** Keyed by `nodeId:port`. */
  private analyses = new Map<string, Analysis>()
  private genTypes: Record<string, ValueType> | null = null
  /** Tiny stand-alone graphs previewed outside the project (the node palette). */
  private sandboxes = new Map<string, Graph>()
  private programs = new Map<string, Program | null>()
  private listeners = new Set<() => void>()
  private frame = 0
  private gl: WebGL2RenderingContext | null = null
  private vertex: WebGLShader | null = null
  private observer: IntersectionObserver | null = null

  constructor() {
    useGraphStore.subscribe((state, prev) => {
      if (sameShader(state.graph, prev.graph)) return
      this.analyses.clear()
      this.genTypes = null
      this.listeners.forEach((l) => l())
    })
  }

  // ── What to show ─────────────────────────────────────────────────────

  /** For `useSyncExternalStore`: notified when previews may have changed kind. */
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Id under which a preview of a node *type* (not a node of the project) can be registered.
   * Its inputs keep their defaults, except the first one that accepts it gets the UV, so the
   * preview shows what the node does to a gradient.
   */
  sandboxId(type: string): string {
    const id = `sandbox:${type}`
    if (!this.sandboxes.has(id)) {
      const uv = { id: 'uv', type: 'uv', position: { x: 0, y: 0 }, values: {} }
      const node = { id, type, position: { x: 0, y: 0 }, values: {} }
      const graph: Graph = { nodes: { uv, [id]: node }, edges: [] }
      const port = compatiblePort(graph, { nodeId: 'uv', port: 'uv', direction: 'from' }, type)
      if (port && type !== 'uv') {
        graph.edges.push({ id: 'wire', from: { nodeId: 'uv', port: 'uv' }, to: { nodeId: id, port } })
      }
      this.sandboxes.set(id, graph)
    }
    return id
  }

  /** The graph a node belongs to: the project, or its sandbox. */
  private graphOf(nodeId: string): Graph {
    return this.sandboxes.get(nodeId) ?? useGraphStore.getState().graph
  }

  kindOf(nodeId: string): PreviewKind {
    return this.analysisOf(nodeId).kind
  }

  /** The output a node previews: the one chosen by the user, else the first. */
  private previewPortOf(nodeId: string): string | null {
    const node = this.graphOf(nodeId).nodes[nodeId]
    if (!node || node.type === NOTE_TYPE) return null
    const outputs = getNodeDef(node.type)?.outputs ?? []
    return (outputs.find((o) => o.name === node.previewPort) ?? outputs[0])?.name ?? null
  }

  private analysisOf(nodeId: string): Analysis {
    const port = this.previewPortOf(nodeId)
    if (port === null) return NONE
    const key = `${nodeId}:${port}`
    let analysis = this.analyses.get(key)
    if (!analysis) {
      analysis = this.analyze(nodeId, port)
      this.analyses.set(key, analysis)
    }
    return analysis
  }

  private analyze(nodeId: string, port: string): Analysis {
    const graph = this.graphOf(nodeId)
    const node = graph.nodes[nodeId]
    const def = node && getNodeDef(node.type)
    const output = def?.outputs.find((o) => o.name === port)
    if (!node || !output) return NONE

    const result = compileGraph(graph, { root: { nodeId, port } })
    if (!result.ok) return NONE

    const genTypes = this.sandboxes.has(nodeId) ? resolveGenTypes(graph) : (this.genTypes ??= resolveGenTypes(graph))
    const type = concreteType(output.type, genTypes[nodeId] ?? 'float')
    const animated = usesInput(result.ir, 'time')
    if (previewKindOf(result.ir) === 'value') {
      try {
        evaluate(result.ir) // make sure the CPU can compute it
        return { kind: 'value', glsl: null, ir: result.ir, type, animated }
      } catch {
        // fall through: show it as a picture instead
      }
    }
    return { kind: 'image', glsl: generateGLSL(result.ir), ir: null, type, animated }
  }

  // ── Registration ─────────────────────────────────────────────────────

  private watch(el: Element, nodeId: string) {
    this.elementToId.set(el, nodeId)
    this.observer ??= new IntersectionObserver((records) => {
      for (const r of records) {
        const id = this.elementToId.get(r.target) ?? ''
        const entry = this.images.get(id) ?? this.values.get(id)
        if (entry) entry.visible = r.isIntersecting
      }
    })
    this.observer.observe(el)
    this.start()
  }

  private unwatch(el: Element) {
    this.observer?.unobserve(el)
    this.elementToId.delete(el)
    if (this.images.size === 0 && this.values.size === 0) this.stop()
  }

  /** Draw this node's preview on a canvas. Returns the function that detaches it. */
  registerImage(nodeId: string, canvas: HTMLCanvasElement): () => void {
    const ctx = canvas.getContext('2d')
    if (!ctx) return () => {}
    this.images.set(nodeId, { ctx, visible: true, drawn: undefined })
    this.watch(canvas, nodeId)
    return () => {
      this.images.delete(nodeId)
      this.unwatch(canvas)
    }
  }

  /** Write this node's value as text in an element. Returns the function that detaches it. */
  registerValue(nodeId: string, el: HTMLElement): () => void {
    this.values.set(nodeId, { el, visible: true, drawn: undefined, text: '' })
    this.watch(el, nodeId)
    return () => {
      this.values.delete(nodeId)
      this.unwatch(el)
    }
  }

  // ── Frame loop ───────────────────────────────────────────────────────

  private start() {
    if (this.frame) return
    const tick = () => {
      const time = performance.now() / 1000
      this.drawImages(time)
      this.updateValues(time)
      this.frame = requestAnimationFrame(tick)
    }
    this.frame = requestAnimationFrame(tick)
  }

  private stop() {
    cancelAnimationFrame(this.frame)
    this.frame = 0
  }

  private updateValues(time: number) {
    for (const [id, entry] of this.values) {
      if (!entry.visible) continue
      const analysis = this.analysisOf(id)
      if (analysis.kind !== 'value' || !analysis.ir) continue
      if (!analysis.animated && entry.drawn === analysis) continue

      const rgb = evaluate(analysis.ir, { time, resolution: getMainSize() })
      const { text, swatch } = describeValue(analysis.type, rgb)
      entry.drawn = analysis
      if (text !== entry.text) {
        entry.text = text
        entry.el.textContent = text
      }
      if (swatch) entry.el.style.setProperty('--swatch', swatch)
      else entry.el.style.removeProperty('--swatch')
    }
  }

  private drawImages(time: number) {
    for (const [id, entry] of this.images) {
      if (!entry.visible) continue
      const analysis = this.analysisOf(id)
      const source = analysis.kind === 'image' ? analysis.glsl : null
      const animated = source !== null && source.includes('u_time')
      if (!animated && entry.drawn === source) continue
      this.draw(entry, source, time)
      entry.drawn = source
    }
    this.pruneProgramsIfLarge()
  }

  private draw(entry: ImageEntry, source: string | null, time: number) {
    const program = source === null ? null : this.programFor(source)
    const gl = this.gl
    if (!program || !gl) {
      entry.ctx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT)
      return
    }
    gl.useProgram(program.program)
    gl.uniform2f(program.resolution, PREVIEW_WIDTH, PREVIEW_HEIGHT)
    gl.uniform1f(program.time, time)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    entry.ctx.drawImage(gl.canvas as HTMLCanvasElement, 0, 0)
  }

  private ensureContext(): WebGL2RenderingContext | null {
    if (this.gl && !this.gl.isContextLost()) return this.gl
    if (this.gl) {
      // Context was lost: everything built on it is gone.
      this.programs.clear()
      this.vertex = null
      this.gl = null
    }
    const canvas = document.createElement('canvas')
    canvas.width = PREVIEW_WIDTH
    canvas.height = PREVIEW_HEIGHT
    const gl = canvas.getContext('webgl2')
    if (!gl) return null
    gl.viewport(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT)
    this.vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SOURCE).shader
    this.gl = gl
    return gl
  }

  private programFor(source: string): Program | null {
    const cached = this.programs.get(source)
    if (cached !== undefined && this.gl && !this.gl.isContextLost()) return cached
    const gl = this.ensureContext()
    if (!gl || !this.vertex) return null
    const { program } = linkProgram(gl, this.vertex, source)
    const entry: Program | null = program
      ? {
          program,
          resolution: gl.getUniformLocation(program, 'u_resolution'),
          time: gl.getUniformLocation(program, 'u_time'),
        }
      : null
    this.programs.set(source, entry)
    return entry
  }

  /** Free programs of shaders that no preview shows anymore. */
  private pruneProgramsIfLarge() {
    if (this.programs.size <= this.images.size * 2 + 16) return
    const used = new Set([...this.analyses.values()].map((a) => a.glsl))
    for (const [source, program] of this.programs) {
      if (used.has(source)) continue
      if (program && this.gl) this.gl.deleteProgram(program.program)
      this.programs.delete(source)
    }
  }
}

export const previewHub = new PreviewHub()
