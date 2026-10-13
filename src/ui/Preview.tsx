import type { ComponentProps } from 'react'
import { Expand, Maximize2, Minimize2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ShaderCanvas } from '@/render/ShaderCanvas'
import type { ShaderStatus } from '@/render/ShaderRenderer'
import { useUIStore } from '@/store/uiStore'
import { Presence } from './Presence'
import { useBackToClose } from './useBackToClose'

interface PreviewProps {
  code: string | null
  onStatus: (status: ShaderStatus) => void
  /** Why the shader cannot be shown, if it cannot. */
  error: string
}

function PanelButton({ label, ...props }: ComponentProps<typeof Button> & { label: string }) {
  return <Button variant="ghost" size="icon-sm" aria-label={label} title={label} {...props} />
}

/**
 * The result of the shader: a panel in the top right corner, in two sizes, that can also fill
 * the screen. The picture itself is left alone (the Mouse node reads the pointer over it).
 */
export function Preview({ code, onStatus, error }: PreviewProps) {
  const open = useUIStore((s) => s.resultOpen)
  const large = useUIStore((s) => s.resultLarge)
  const fullscreen = useUIStore((s) => s.previewFullscreen)
  const setFullscreen = useUIStore((s) => s.setPreviewFullscreen)
  useBackToClose(fullscreen, () => setFullscreen(false))

  return (
    <>
      <Presence
        show={open}
        from="right"
        data-result=""
        className={cn(
          'absolute top-3 right-3 flex flex-col overflow-hidden rounded-xl border bg-card shadow-lg transition-[width] duration-200 ease-out sm:top-4 sm:right-4',
          // Large, on a phone: as wide as the screen allows, under the bar of the top left corner.
          large ? 'w-[calc(100%-1.5rem)] max-sm:top-[4.25rem] sm:w-96' : 'w-40 sm:w-56',
          error && 'border-destructive',
        )}
      >
        <div className="aspect-square w-full bg-background">
          <ShaderCanvas code={code} onStatus={onStatus} />
        </div>
        {error && (
          <pre className="max-h-28 overflow-y-auto border-t border-destructive px-2.5 py-2 text-xs whitespace-pre-wrap text-destructive">{error}</pre>
        )}
        <div className="flex h-9 items-center border-t pr-1 pl-2.5">
          <span className={cn('min-w-0 flex-1 truncate text-xs text-muted-foreground', error && 'text-destructive')}>
            {error ? 'Cannot display' : 'Result'}
          </span>
          <PanelButton label={large ? 'Smaller' : 'Larger'} onClick={() => useUIStore.getState().toggleResultLarge()}>
            {large ? <Minimize2 /> : <Maximize2 />}
          </PanelButton>
          <PanelButton label="Fullscreen" onClick={() => setFullscreen(true)}>
            <Expand />
          </PanelButton>
          <PanelButton label="Hide the result" onClick={() => useUIStore.getState().toggleResult()}>
            <X />
          </PanelButton>
        </div>
      </Presence>

      <Presence show={fullscreen} from="fade" className="fixed inset-0 z-50 bg-background">
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
      </Presence>
    </>
  )
}
