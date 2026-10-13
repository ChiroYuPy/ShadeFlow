import type { ComponentProps, ReactNode } from 'react'
import { Dialog } from 'radix-ui'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SLIDE } from './motion'
import { useBackToClose } from './useBackToClose'
import { useVisualViewportVars } from './useVisualViewport'

interface OverlayProps extends Omit<ComponentProps<typeof Dialog.Content>, 'title'> {
  open: boolean
  onClose: () => void
  /** Read by screen readers; shown by the content itself when it wants a visible title. */
  title: string
  children: ReactNode
}

/**
 * The shell shared by the app's big overlays (add a node, project): centered on a wide screen,
 * a sheet over the bottom of a phone (see `motion.ts` for how it comes and goes). Escape, the backdrop and the Back button close it.
 * Its content is mounted while it is open only, so it starts afresh each time.
 */
export function Overlay({ open, onClose, title, className, children, ...props }: OverlayProps) {
  useVisualViewportVars()
  useBackToClose(open, onClose)

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className={cn('fixed inset-0 z-50 bg-black/50', SLIDE.fade)} />
        <Dialog.Content
          aria-describedby={undefined}
          // A phone would open its keyboard over half of the content: let the user look first.
          onOpenAutoFocus={(e) => window.matchMedia('(pointer: coarse)').matches && e.preventDefault()}
          {...props}
          className={cn(
            'fixed z-50 flex flex-col overflow-hidden border bg-popover text-popover-foreground shadow-2xl outline-none',
            SLIDE.sheet,
            // Phone: a sheet over the bottom of what is visible (the keyboard shrinks it).
            'max-sm:inset-x-0 max-sm:top-[calc(var(--vv-top,0px)+var(--vv-height,100dvh)*0.14)] max-sm:h-[calc(var(--vv-height,100dvh)*0.86)] max-sm:rounded-t-2xl max-sm:border-x-0 max-sm:border-b-0',
            // Wide screen: centered.
            'sm:top-[12%] sm:left-1/2 sm:max-h-[76%] sm:w-[36rem] sm:-translate-x-1/2 sm:rounded-xl',
            className,
          )}
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** The close button of an overlay: always there, big enough for a thumb. */
export function OverlayClose() {
  return (
    <Dialog.Close
      aria-label="Close"
      title="Close (Esc)"
      className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground sm:size-8"
    >
      <X className="size-5 sm:size-4" />
    </Dialog.Close>
  )
}
