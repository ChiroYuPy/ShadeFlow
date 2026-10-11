import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useUIStore } from '@/store/uiStore'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const MOD = isMac ? '⌘' : 'Ctrl'

interface Gesture {
  /** Keys / mouse actions, in order. */
  keys: string[]
  /** Several alternatives for the same thing. */
  or?: string[][]
  does: string
}

const SECTIONS: { title: string; items: Gesture[] }[] = [
  {
    title: 'Build',
    items: [
      { keys: [MOD, 'K'], or: [['Double-click the canvas']], does: 'Add a node' },
      { keys: ['Right-click a node, a wire or the canvas'], does: 'Open its menu: duplicate, copy, delete, fold…' },
      { keys: ['Drop a wire on empty space'], does: 'Add a node that fits, already connected' },
      { keys: ['Drag a wire end'], does: 'Move it to another port, or drop it on empty space to remove it' },
      { keys: ['Eye icon in a node header'], does: 'Show or hide that node\'s live preview (hidden by default)' },
      { keys: ['Arrow in a node header'], does: 'Fold the node: only the plugs in use stay visible' },
      { keys: ['Click a line in the code panel'], does: 'Select the node that produced it; selecting a node lights up its lines' },
      { keys: ['Click a node output name'], does: 'Choose which output the node previews' },
    ],
  },
  {
    title: 'Edit values',
    items: [
      { keys: ['Drag a number sideways'], does: 'Change it (Shift: faster, Alt: finer)' },
      { keys: ['Click a number'], does: 'Type a value' },
      { keys: ['↑', '↓'], does: 'Step a number while typing (Shift: bigger steps)' },
    ],
  },
  {
    title: 'Select and organize',
    items: [
      { keys: [MOD, 'Click'], does: 'Add a node to the selection' },
      { keys: ['Shift', 'Drag'], does: 'Select with a rectangle' },
      { keys: ['V'], does: 'Select tool: dragging the background draws a rectangle (handy on touch screens)' },
      { keys: ['H'], does: 'Move tool: dragging the background moves the view' },
      { keys: [MOD, 'C / X / V'], does: 'Copy, cut and paste (also between tabs)' },
      { keys: [MOD, 'A'], does: 'Select every node' },
      { keys: [MOD, 'D'], does: 'Duplicate the selection' },
      { keys: ['Delete'], does: 'Remove the selection' },
    ],
  },
  {
    title: 'History and view',
    items: [
      { keys: [MOD, 'Z'], does: 'Undo' },
      { keys: [MOD, 'Shift', 'Z'], does: 'Redo' },
      { keys: ['Scroll'], does: 'Zoom' },
      { keys: ['Zoom buttons'], does: 'Zoom in, zoom out, or fit the whole graph' },
      { keys: ['Drag the background'], does: 'Move around' },
      { keys: ['Touch: tap a node first'], does: 'Its fields, buttons and position only react once it is selected, so panning and pinching never change anything by accident' },
      { keys: ['?'], does: 'Show this help' },
    ],
  },
]

function Keys({ keys }: { keys: string[] }) {
  // A one-word action is plain text; real keys get a key-cap look.
  const isAction = keys.length === 1 && keys[0].includes(' ')
  if (isAction) return <span className="text-foreground">{keys[0]}</span>
  return (
    <span className="flex flex-wrap items-center gap-1">
      {keys.map((k, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-muted-foreground">+</span>}
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">{k}</kbd>
        </span>
      ))}
    </span>
  )
}

/** Everything you can do that is not obvious from the interface. */
export default function HelpDialog() {
  const open = useUIStore((s) => s.helpOpen)

  return (
    <Dialog open={open} onOpenChange={(o) => useUIStore.getState().setHelpOpen(o)}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Gestures and shortcuts</DialogTitle>
          <DialogDescription>
            Connect nodes from output (right) to input (left). Hover a node to read what it does.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">{section.title}</h3>
              <ul className="flex flex-col gap-2">
                {section.items.map((item) => (
                  <li key={item.does} className="flex items-start justify-between gap-4 text-sm">
                    <span className="flex flex-col gap-1">
                      <Keys keys={item.keys} />
                      {item.or?.map((alt, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">or</span>
                          <Keys keys={alt} />
                        </span>
                      ))}
                    </span>
                    <span className="max-w-[55%] text-right text-muted-foreground">{item.does}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
