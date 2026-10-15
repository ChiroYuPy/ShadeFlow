import { useEffect, useRef, useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'
import { previewHub, PREVIEW_SIZE } from '@/render/previewHub'

interface PreviewProps {
  nodeId: string
  className?: string
  /**
   * At the bottom of a node, in whole grid cells: a picture of 7 × 7 cells with half a cell around
   * it (8 × 8 in all), a value in one cell (two for a color).
   */
  inNode?: boolean
}

function ImagePreview({ nodeId, className, inNode }: PreviewProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => previewHub.registerImage(nodeId, ref.current!), [nodeId])
  return (
    <canvas
      ref={ref}
      width={PREVIEW_SIZE}
      height={PREVIEW_SIZE}
      className={cn('block aspect-square w-full rounded-md bg-background', inNode && 'm-3.5 w-49', className)}
    />
  )
}

/**
 * The node's value as text. Colors (`--swatch` is set by the hub) fill the whole preview,
 * so the color itself is what you see.
 */
function ValuePreview({ nodeId, className, inNode }: PreviewProps) {
  const ref = useRef<HTMLOutputElement>(null)
  useEffect(() => previewHub.registerValue(nodeId, ref.current!), [nodeId])
  return (
    <output
      ref={ref}
      className={cn(
        "flex h-7 items-center justify-center rounded-md bg-background px-2 font-mono text-xs tabular-nums [&[style*='--swatch']]:min-h-12 [&[style*='--swatch']]:bg-[var(--swatch)] [&[style*='--swatch']]:text-white [&[style*='--swatch']]:mix-blend-difference",
        inNode && "mx-3.5 my-1 h-5 [&[style*='--swatch']]:h-12",
        className,
      )}
    />
  )
}

/**
 * Live preview of a node's output: a picture when the value varies across the screen,
 * its number otherwise (a flat rectangle would say nothing).
 */
export function NodePreview(props: PreviewProps) {
  const kind = useSyncExternalStore(previewHub.subscribe, () => previewHub.kindOf(props.nodeId))
  if (kind === 'image') return <ImagePreview {...props} />
  if (kind === 'value') return <ValuePreview {...props} />
  return null
}
