import { useEffect, useRef, type PointerEvent } from 'react'
import { cn } from '@/lib/utils'
import { setMouse } from './mouse'
import { ShaderRenderer, type ShaderStatus } from './ShaderRenderer'

interface ShaderCanvasProps {
  /** GLSL ES 3.00 fragment shader source. `null` keeps the current shader running. */
  code: string | null
  /** Called after each compile attempt. */
  onStatus?: (status: ShaderStatus) => void
  className?: string
}

export function ShaderCanvas({ code, onStatus, className }: ShaderCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<ShaderRenderer | null>(null)
  const onStatusRef = useRef(onStatus)

  useEffect(() => {
    onStatusRef.current = onStatus
  })

  useEffect(() => {
    const renderer = new ShaderRenderer(canvasRef.current!)
    rendererRef.current = renderer
    renderer.start()
    return () => {
      renderer.dispose()
      rendererRef.current = null
    }
  }, [])

  useEffect(() => {
    if (code === null) return
    const status = rendererRef.current?.setSource(code)
    if (status) onStatusRef.current?.(status)
  }, [code])

  // The Mouse node reads the pointer over the result (also while a finger drags on it: `touch-none`
  // keeps the browser from taking that drag to scroll, which would stop the events after a few pixels).
  const trackPointer = (e: PointerEvent<HTMLCanvasElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    if (box.width > 0 && box.height > 0) {
      setMouse((e.clientX - box.left) / box.width, 1 - (e.clientY - box.top) / box.height)
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className={cn('block h-full w-full touch-none', className)}
      onPointerMove={trackPointer}
      onPointerDown={trackPointer}
    />
  )
}
