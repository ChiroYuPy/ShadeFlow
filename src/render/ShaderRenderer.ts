import { compileShader, linkProgram, VERTEX_SOURCE } from './gl'
import { setMainSize } from './mainSize'
import { getMouse } from './mouse'

/**
 * Minimal WebGL2 renderer: draws one fragment shader on a full-screen quad.
 * Knows nothing about nodes — it only receives GLSL source.
 *
 * Uniforms provided to the shader: `u_resolution` (vec2, pixels), `u_time` (float, seconds
 * since the page loaded, so every renderer in the app shows the same time), `u_mouse` (vec2,
 * the pointer over the result in UV units).
 */

export type ShaderStatus = { ok: true } | { ok: false; log: string }

export class ShaderRenderer {
  private canvas: HTMLCanvasElement
  private gl: WebGL2RenderingContext
  private vertex: WebGLShader | null = null
  private program: WebGLProgram | null = null
  private resolutionLoc: WebGLUniformLocation | null = null
  private timeLoc: WebGLUniformLocation | null = null
  private mouseLoc: WebGLUniformLocation | null = null
  private source: string | null = null
  private frame = 0

  private onContextLost = (e: Event) => {
    e.preventDefault()
    this.program = null
    this.vertex = null
  }
  private onContextRestored = () => {
    if (this.source !== null) this.setSource(this.source)
  }

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2')
    if (!gl) throw new Error('WebGL2 is not supported by this browser')
    this.canvas = canvas
    this.gl = gl
    canvas.addEventListener('webglcontextlost', this.onContextLost)
    canvas.addEventListener('webglcontextrestored', this.onContextRestored)
  }

  /**
   * Compile and use a new fragment shader. On failure the previous shader
   * keeps running and the compiler log is returned.
   */
  setSource(fragmentSource: string): ShaderStatus {
    this.source = fragmentSource
    const gl = this.gl
    if (gl.isContextLost()) return { ok: false, log: 'WebGL context lost' }

    this.vertex ??= compileShader(gl, gl.VERTEX_SHADER, VERTEX_SOURCE).shader
    if (!this.vertex) return { ok: false, log: 'Could not compile the vertex shader' }

    const { program, log } = linkProgram(gl, this.vertex, fragmentSource)
    if (!program) return { ok: false, log }

    if (this.program) gl.deleteProgram(this.program)
    this.program = program
    this.resolutionLoc = gl.getUniformLocation(program, 'u_resolution')
    this.timeLoc = gl.getUniformLocation(program, 'u_time')
    this.mouseLoc = gl.getUniformLocation(program, 'u_mouse')
    return { ok: true }
  }

  start() {
    if (this.frame) return
    const loop = () => {
      this.draw(performance.now() / 1000)
      this.frame = requestAnimationFrame(loop)
    }
    this.frame = requestAnimationFrame(loop)
  }

  stop() {
    cancelAnimationFrame(this.frame)
    this.frame = 0
  }

  dispose() {
    this.stop()
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost)
    this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored)
    if (this.program) this.gl.deleteProgram(this.program)
    if (this.vertex) this.gl.deleteShader(this.vertex)
    this.program = null
    this.vertex = null
  }

  private draw(time: number) {
    const { gl, canvas } = this
    if (!this.program || gl.isContextLost()) return

    // Match the drawing buffer to the displayed size (device pixels).
    const dpr = window.devicePixelRatio || 1
    const width = Math.max(1, Math.round(canvas.clientWidth * dpr))
    const height = Math.max(1, Math.round(canvas.clientHeight * dpr))
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
      setMainSize(width, height)
    }

    gl.viewport(0, 0, width, height)
    gl.useProgram(this.program)
    gl.uniform2f(this.resolutionLoc, width, height)
    gl.uniform1f(this.timeLoc, time)
    gl.uniform2f(this.mouseLoc, ...getMouse())
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }
}
