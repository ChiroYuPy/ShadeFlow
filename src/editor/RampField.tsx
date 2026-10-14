import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { MAX_RAMP_STOPS, MIN_RAMP_STOPS, readRamp, sampleRamp, writeRamp, type RampStop } from '@/core'
import { cn } from '@/lib/utils'
import { useDraft } from './useDraft'
import { ColorField, NumberField } from './ValueFields'

const css = (c: readonly number[]) => `rgb(${c.map((v) => Math.round(v * 255)).join(' ')})`

const round = (n: number) => Math.round(n * 1000) / 1000

/**
 * The gradient of a Color Ramp: click the bar to add a color, drag a color to move it, click one
 * to edit it below the bar. While a color is dragged, only the bar follows: the graph gets the
 * gradient when it is let go. A selected color is only selected while the field has the focus:
 * clicking elsewhere or Escape drops it, Delete removes it (and not the node).
 */
export function RampField({ value, onChange }: { value: number[]; onChange: (values: number[]) => void }) {
  const draft = useDraft(value, onChange)
  const stops = readRamp(draft.shown)
  const [selected, setSelected] = useState<number | null>(null)
  const current = selected === null ? null : Math.min(selected, stops.length - 1)
  const field = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  /** Index of the stop being dragged, kept up to date as it passes others. */
  const dragging = useRef<number | null>(null)

  /** Writes the stops back, sorted, and keeps `stop` selected wherever it lands. */
  const commit = (list: RampStop[], stop: RampStop) => {
    const sorted = [...list].sort((a, b) => a.position - b.position)
    const index = sorted.indexOf(stop)
    setSelected(index)
    if (dragging.current === null) onChange(writeRamp(sorted))
    else {
      dragging.current = index
      draft.change(writeRamp(sorted))
    }
  }

  const update = (index: number, change: Partial<RampStop>) => {
    const list = [...stops]
    list[index] = { ...list[index], ...change }
    commit(list, list[index])
  }

  const remove = (index: number) => {
    if (stops.length <= MIN_RAMP_STOPS) return
    setSelected(null)
    onChange(writeRamp(stops.filter((_, i) => i !== index)))
  }

  const positionAt = (e: PointerEvent) => {
    const rect = track.current!.getBoundingClientRect()
    return round(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)))
  }

  const grab = (e: PointerEvent, index: number) => {
    e.stopPropagation()
    e.preventDefault() // keeps the focus where we put it
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = index
    setSelected(index)
    field.current?.focus()
  }

  const release = () => {
    if (dragging.current === null) return
    dragging.current = null
    draft.commit()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    // The fields below keep their keys (Backspace edits the text).
    if (current === null || e.target instanceof HTMLInputElement) return
    if (e.key === 'Delete' || e.key === 'Backspace') remove(current)
    else if (e.key === 'Escape') setSelected(null)
    else return
    e.preventDefault()
    e.stopPropagation() // not the node, not the selection
  }

  const gradient = `linear-gradient(to right, ${stops.map((s) => `${css(s.color)} ${s.position * 100}%`).join(', ')})`
  const stop = current === null ? null : stops[current]

  return (
    <div
      ref={field}
      tabIndex={-1}
      className="nodrag nopan flex flex-col gap-1 px-3 pt-1 pb-2 outline-none"
      style={{ touchAction: 'none' }}
      onKeyDown={onKeyDown}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setSelected(null)
      }}
      onPointerMove={(e) => {
        if (dragging.current !== null) update(dragging.current, { position: positionAt(e) })
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      {/* The bar and the colors share one track, inset by half a color so the ends sit on its edges. */}
      <div className="px-1.5">
        <div ref={track} className="relative">
          <div
            data-ramp-bar=""
            title={stops.length < MAX_RAMP_STOPS ? 'Click to add a color' : undefined}
            // The outline is drawn over the gradient, so it never shows past the rounded corners.
            className={cn(
              'h-4 rounded-[3px] shadow-[inset_0_0_0_1px_var(--border)]',
              stops.length < MAX_RAMP_STOPS ? 'cursor-copy' : 'cursor-default',
            )}
            style={{ background: gradient }}
            onPointerDown={(e) => {
              if (stops.length >= MAX_RAMP_STOPS) return
              // A new color takes the one already there: the gradient does not change until it is edited.
              const position = positionAt(e)
              const added: RampStop = { position, color: sampleRamp(stops, position) }
              const list = [...stops, added]
              grab(e, [...list].sort((a, b) => a.position - b.position).indexOf(added))
              commit(list, added)
            }}
          />
          <div className="relative h-4">
            {stops.map((s, i) => (
              <button
                key={i}
                type="button"
                tabIndex={-1}
                data-ramp-stop=""
                aria-label={`Color at ${s.position}`}
                aria-pressed={i === current}
                className={cn(
                  // A short stem links the color to its place on the bar.
                  'absolute top-1 size-3 -translate-x-1/2 cursor-ew-resize rounded-full transition-transform duration-100',
                  'before:absolute before:bottom-full before:left-1/2 before:h-1 before:w-px before:-translate-x-1/2',
                  i === current
                    ? 'scale-125 shadow-[0_0_0_1.5px_var(--foreground)] before:bg-foreground'
                    : 'shadow-[0_0_0_1px_var(--node-border),0_0_0_2.5px_var(--node)] before:bg-muted-foreground',
                )}
                style={{ left: `${s.position * 100}%`, background: css(s.color) }}
                onPointerDown={(e) => grab(e, i)}
              />
            ))}
          </div>
        </div>
      </div>
      {/* The row keeps its height either way, so the node does not jump. */}
      <div className="flex h-6 items-center gap-1">
        {stop === null || current === null ? (
          <span className="truncate text-xs text-muted-foreground">Click a color to edit it</span>
        ) : (
          <>
            <ColorField value={stop.color} onChange={(c) => update(current, { color: [c[0], c[1], c[2]] })} />
            <NumberField title="Position" value={stop.position} onChange={(n) => update(current, { position: Math.min(1, Math.max(0, n)) })} />
            <button
              type="button"
              aria-label="Remove this color"
              title="Remove this color (Delete)"
              disabled={stops.length <= MIN_RAMP_STOPS}
              className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40 [&_svg]:size-3.5"
              onClick={() => remove(current)}
            >
              <Trash2 />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
