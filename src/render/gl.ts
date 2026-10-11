/** Small WebGL2 helpers shared by the main renderer and the node previews. */

// Full-screen triangle generated from gl_VertexID: no buffers needed.
export const VERTEX_SOURCE = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

export function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): { shader: WebGLShader | null; log: string } {
  const shader = gl.createShader(type)
  if (!shader) return { shader: null, log: 'Could not create shader' }
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? 'Unknown compile error'
    gl.deleteShader(shader)
    return { shader: null, log }
  }
  return { shader, log: '' }
}

/** Compile `fragmentSource` and link it with an already compiled vertex shader. */
export function linkProgram(
  gl: WebGL2RenderingContext,
  vertex: WebGLShader,
  fragmentSource: string,
): { program: WebGLProgram | null; log: string } {
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
  if (!fragment.shader) return { program: null, log: fragment.log }

  const program = gl.createProgram()
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment.shader)
  gl.linkProgram(program)
  gl.deleteShader(fragment.shader)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? 'Unknown link error'
    gl.deleteProgram(program)
    return { program: null, log }
  }
  return { program, log: '' }
}
