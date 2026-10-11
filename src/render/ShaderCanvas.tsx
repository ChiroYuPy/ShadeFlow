import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
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

  return <canvas ref={canvasRef} className={cn('block h-full w-full', className)} />
}
