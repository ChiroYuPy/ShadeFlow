/** Where the mouse last was over the canvas (screen coordinates), or `null` when it is elsewhere. */
let overCanvas: { x: number; y: number } | null = null

if (typeof window !== 'undefined') {
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return
    const onPane = e.target instanceof Element && e.target.closest('.react-flow') !== null
    overCanvas = onPane ? { x: e.clientX, y: e.clientY } : null
  })
  document.addEventListener('pointerleave', () => (overCanvas = null))
}

/** The canvas point under the mouse, for a key that adds something "here". */
export const pointerOnCanvas = () => overCanvas
