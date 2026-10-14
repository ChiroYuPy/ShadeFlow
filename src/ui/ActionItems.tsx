import { createElement } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { ACTIONS, describe, type ActionEnv, type ActionId, type ActionState, type MenuEntry } from './actions'

interface ActionMenuProps {
  items: MenuEntry[]
  state: ActionState
  env: ActionEnv
  /** A more precise name in this menu ("Delete wire"). */
  labels?: Partial<Record<ActionId, string>>
}

/** The entries of a menu: what is not offered right now is left out, and so are the separators it leaves alone. */
export function ActionMenuItems({ items, state, env, labels }: ActionMenuProps) {
  const kept: MenuEntry[] = []
  for (const item of items) {
    if (item !== '-') {
      if (describe(item, state).available) kept.push(item)
    } else if (kept.length > 0 && kept.at(-1) !== '-') kept.push(item)
  }
  if (kept.at(-1) === '-') kept.pop()
  return kept.map((item, i) => {
    if (item === '-') return <DropdownMenuSeparator key={`-${i}`} />
    const a = describe(item, state)
    return (
      <DropdownMenuItem
        key={item}
        variant={a.destructive ? 'destructive' : 'default'}
        disabled={!a.enabled}
        onSelect={() => ACTIONS[item].run(env)}
      >
        {createElement(a.icon)}
        {labels?.[item] ?? a.label}
        {a.checked && <Check />}
        {/* A touch screen has no keys to show. */}
        {a.shortcut && <span className="ml-auto pl-4 text-xs text-muted-foreground pointer-coarse:hidden">{a.shortcut}</span>}
      </DropdownMenuItem>
    )
  })
}

/** An action as an icon button of a bar; its name and key are in the tooltip. */
export function ActionButton({ id, state, env, className }: { id: ActionId; state: ActionState; env: ActionEnv; className?: string }) {
  const a = describe(id, state)
  if (!a.available) return null
  const title = a.shortcut ? `${a.label} (${a.shortcut})` : a.label
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={title}
      title={title}
      aria-pressed={a.checked}
      disabled={!a.enabled}
      onClick={() => ACTIONS[id].run(env)}
      className={cn(a.checked && 'bg-selection/15 text-selection', className)}
    >
      {createElement(a.icon)}
    </Button>
  )
}
