import { EXAMPLES, type Example } from '@/demo/examples'
import { NodePreview } from '@/editor/NodePreview'
import { previewHub } from '@/render/previewHub'
import { confirmReplace, loadGraph } from '@/store/fileActions'
import { useUIStore } from '@/store/uiStore'
import { Overlay, OverlayHeader } from './Overlay'

const close = () => useUIStore.getState().setExamplesOpen(false)

/** An example to open: what it draws, live, with its name. */
function ExampleCard({ example, onOpen }: { example: Example; onOpen: () => void }) {
  return (
    <button
      type="button"
      data-example={example.id}
      onClick={onOpen}
      className="flex flex-col overflow-hidden rounded-lg bg-background/60 text-left outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
    >
      <NodePreview nodeId={previewHub.resultId(example.id, example.graph)} className="rounded-none" />
      <span className="flex flex-col gap-0.5 px-2.5 py-2">
        <span className="text-sm font-medium">{example.name}</span>
        <span className="text-xs text-muted-foreground">{example.description}</span>
      </span>
    </button>
  )
}

/** The examples to learn from, as cards showing a live picture of what each one draws. */
export default function ExamplesPanel() {
  const open = useUIStore((s) => s.examplesOpen)

  return (
    <Overlay open={open} onClose={close} title="Examples" data-examples="" className="sm:w-[44rem]">
      <OverlayHeader title="Examples" />
      {/* The list scrolls; the grid inside keeps its cards at their full size. */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {EXAMPLES.map((example) => (
            <ExampleCard
              key={example.id}
              example={example}
              onOpen={() => {
                close()
                // Asks first when there is something to lose.
                confirmReplace(`Open the “${example.name}” example?`, () => loadGraph(example.graph))
              }}
            />
          ))}
        </div>
      </div>
    </Overlay>
  )
}
