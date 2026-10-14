import { useUIStore } from '@/store/uiStore'
import { keysOf, MOD, type ActionId } from './actions'
import { Overlay, OverlayHeader } from './Overlay'

interface Gesture {
  /** Keys / mouse actions, in order. */
  keys: string[]
  /** Several alternatives for the same thing. */
  or?: string[][]
  does: string
}

/** An action's keys, as the registry has them. */
function key(id: ActionId, does: string, more: string[][] = []): Gesture {
  const [keys, ...or] = keysOf(id)
  return { keys, or: [...or, ...more], does }
}

const SECTIONS: { title: string; items: Gesture[] }[] = [
  {
    title: 'Build',
    items: [
      key('add', 'Add a node where the pointer is: type its name, then Enter', [['Double-click the canvas']]),
      { keys: ['Right-click a node, a wire or the canvas'], does: 'Open its menu: duplicate, copy, delete, fold…' },
      { keys: ['Drop a wire on empty space'], does: 'Add a node that fits, already connected' },
      { keys: ['Drag a wire end'], does: 'Move it to another port, or drop it on empty space to remove it' },
      { keys: ['Eye icon in a node header'], does: 'Show or hide that node\'s live preview (hidden by default)' },
      { keys: ['Arrow in a node header'], does: 'Fold the node: only the plugs in use stay visible' },
      { keys: ['Click a node output name'], does: 'Choose which output the node previews' },
      key('about', 'Read what the selected node does'),
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
      key('previews', 'Show or hide the previews of the selected nodes'),
      key('fold', 'Fold or unfold the selected nodes'),
      { keys: ['Touch: dashed square in the selection bar'], does: 'Draw one rectangle with your finger to select an area' },
      { keys: ['Touch: ⋯ in the selection bar'], does: 'Everything the right-click menu of a node offers' },
      { keys: [MOD, 'C / X / V'], does: 'Copy, cut and paste (also between tabs)' },
      key('selectAll', 'Select every node'),
      key('duplicate', 'Duplicate the selection'),
      key('delete', 'Remove the selection'),
      key('deselect', 'Leave a field, then drop the selection'),
    ],
  },
  {
    title: 'History and view',
    items: [
      key('undo', 'Undo'),
      key('redo', 'Redo'),
      { keys: ['Scroll'], or: [['+', '−']], does: 'Zoom' },
      key('frame', 'Frame the selection, or the whole graph when nothing is selected'),
      key('result', 'Show or hide the result'),
      key('code', 'Show or hide the generated code'),
      key('save', 'Save the project to a file'),
      key('open', 'Open a project file'),
      { keys: ['Drag the background'], does: 'Move around' },
      { keys: ['Touch: tap a node first'], does: 'Its fields, buttons and position only react once it is selected, so panning and pinching never change anything by accident' },
      key('help', 'Show this help'),
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

const close = () => useUIStore.getState().setHelpOpen(false)

/** Everything you can do that is not obvious from the interface. */
export default function HelpDialog() {
  const open = useUIStore((s) => s.helpOpen)

  return (
    <Overlay open={open} onClose={close} title="Gestures and shortcuts" data-help="">
      <OverlayHeader title="Gestures and shortcuts" />
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain p-4">
        <p className="text-sm text-muted-foreground">
          Connect nodes from output (right) to input (left). Right-click a node, then “About this node”, to read what it does.
        </p>
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
    </Overlay>
  )
}
