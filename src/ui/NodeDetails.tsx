import type { ComponentProps } from 'react'
import type { NodeDef } from '@/core'
import { cn } from '@/lib/utils'

/** A port as a colored dot and its name. A generic port takes whatever vector type is wired. */
function PortChip({ label, type }: { label: string; type: string }) {
  const any = type === 'gen'
  return (
    <li className="flex min-w-0 items-center gap-2">
      <span
        className={cn('size-2.5 shrink-0 rounded-full', any && 'bg-muted-foreground')}
        style={any ? undefined : { background: `var(--port-${type})` }}
      />
      <span className="truncate">{label}</span>
      <span className="ml-auto text-xs text-muted-foreground">{any ? 'any' : type}</span>
    </li>
  )
}

/** What a node does, and what it takes and gives (the palette's details, the "About" of a node). */
export function NodeDetails({
  description,
  def,
  className,
  ...props
}: ComponentProps<'div'> & { description: string; def: NodeDef | null }) {
  const inputs = def?.inputs.filter((p) => p.connectable !== false) ?? []
  const outputs = def?.type === 'output' ? [] : (def?.outputs ?? [])
  return (
    <div {...props} className={cn('flex flex-col gap-3', className)}>
      <p className="text-sm text-muted-foreground">{description}</p>
      {def && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <div className="text-xs font-medium text-muted-foreground">Inputs</div>
          <div className="text-xs font-medium text-muted-foreground">Outputs</div>
          <ul className="flex min-w-0 flex-col gap-1">
            {inputs.length === 0 && <li className="text-muted-foreground">None</li>}
            {inputs.map((p) => (
              <PortChip key={p.name} label={p.label} type={p.type} />
            ))}
          </ul>
          <ul className="flex min-w-0 flex-col gap-1">
            {outputs.length === 0 && <li className="text-muted-foreground">None</li>}
            {outputs.map((p) => (
              <PortChip key={p.name} label={p.label} type={p.type} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
