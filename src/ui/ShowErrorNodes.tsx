import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/uiStore'
import { useFit } from './view'

/** "Show it": selects the nodes in error and frames them, wherever they are on the canvas. */
export function ShowErrorNodes({ ids, className }: { ids: string[]; className?: string }) {
  const fit = useFit()
  if (ids.length === 0) return null
  return (
    <Button
      variant="outline"
      size="sm"
      data-show-error=""
      className={cn('border-destructive text-destructive hover:text-destructive', className)}
      onClick={() => {
        useUIStore.getState().setSelection(ids)
        fit()
      }}
    >
      {ids.length > 1 ? 'Show the nodes' : 'Show the node'}
    </Button>
  )
}
