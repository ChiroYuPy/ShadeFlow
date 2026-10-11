import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useUIStore } from '@/store/uiStore'

/** Asks before an action that replaces the project (see `confirmReplace`). */
export function ConfirmDialog() {
  const confirmation = useUIStore((s) => s.confirmation)
  const close = () => useUIStore.getState().setConfirmation(null)

  return (
    <Dialog open={confirmation !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Replace the project?</DialogTitle>
          <DialogDescription>{confirmation?.message}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            autoFocus
            onClick={() => {
              const run = confirmation?.run
              close()
              run?.()
            }}
          >
            {confirmation?.confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
