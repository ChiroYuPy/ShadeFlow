import { Maximize2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ShaderCanvas } from '@/render/ShaderCanvas'
import type { ShaderStatus } from '@/render/ShaderRenderer'
import { useUIStore } from '@/store/uiStore'

interface PreviewProps {
  code: string | null
  onStatus: (status: ShaderStatus) => void
  /** The shader cannot be shown: the frame turns red. */
  failed: boolean
}

/** Floating preview of the result. Click it to go fullscreen. */
export function Preview({ code, onStatus, failed }: PreviewProps) {
  const fullscreen = useUIStore((s) => s.previewFullscreen)
  const setFullscreen = useUIStore((s) => s.setPreviewFullscreen)

  return (
    <>
      <button
        type="button"
        aria-label="Open preview fullscreen"
        onClick={() => setFullscreen(true)}
        className={cn(
          'group absolute top-3 right-3 w-40 cursor-pointer overflow-hidden rounded-xl border bg-card text-left shadow-lg transition-colors hover:border-ring sm:top-4 sm:right-4 sm:w-56',
          failed && 'border-destructive',
        )}
      >
        <div className="aspect-square w-full bg-background">
          <ShaderCanvas code={code} onStatus={onStatus} />
        </div>
        <div className="flex h-7 items-center justify-between border-t px-2.5 text-xs text-muted-foreground">
          <span className={cn(failed && 'text-destructive')}>{failed ? 'Cannot display' : 'Result'}</span>
          <Maximize2 className="size-3.5 opacity-60 transition-opacity group-hover:opacity-100" />
        </div>
      </button>

      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-background">
          <ShaderCanvas code={code} />
          <Button
            variant="secondary"
            size="icon"
            aria-label="Close fullscreen (Esc)"
            title="Close (Esc)"
            className="absolute top-4 right-4"
            onClick={() => setFullscreen(false)}
          >
            <X />
          </Button>
        </div>
      )}
    </>
  )
}
