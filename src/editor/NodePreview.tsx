import { useEffect, useRef, useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'
import { previewHub, PREVIEW_SIZE } from '@/render/previewHub'

function ImagePreview({ nodeId, className }: { nodeId: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => previewHub.registerImage(nodeId, ref.current!), [nodeId])
  return (
    <canvas
      ref={ref}
      width={PREVIEW_SIZE}
      height={PREVIEW_SIZE}
      className={cn('block aspect-square w-full rounded-md bg-background', className)}
    />
  )
}

/**
 * The node's value as text. Colors (`--swatch` is set by the hub) fill the whole preview,
 * so the color itself is what you see.
 */
function ValuePreview({ nodeId, className }: { nodeId: string; className?: string }) {
  const ref = useRef<HTMLOutputElement>(null)
  useEffect(() => previewHub.registerValue(nodeId, ref.current!), [nodeId])
  return (
    <output
      ref={ref}
      className={cn(
        "flex h-7 items-center justify-center rounded-md bg-background px-2 font-mono text-xs tabular-nums [&[style*='--swatch']]:min-h-12 [&[style*='--swatch']]:bg-[var(--swatch)] [&[style*='--swatch']]:text-white [&[style*='--swatch']]:mix-blend-difference",
        className,
      )}
    />
  )
}

/**
 * Live preview of a node's output: a picture when the value varies across the screen,
 * its number otherwise (a flat rectangle would say nothing).
 */
export function NodePreview({ nodeId, className }: { nodeId: string; className?: string }) {
  const kind = useSyncExternalStore(previewHub.subscribe, () => previewHub.kindOf(nodeId))
  if (kind === 'image') return <ImagePreview nodeId={nodeId} className={className} />
  if (kind === 'value') return <ValuePreview nodeId={nodeId} className={className} />
  return null
}
