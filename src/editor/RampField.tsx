import { useRef, useState, type PointerEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { MAX_RAMP_STOPS, MIN_RAMP_STOPS, readRamp, sampleRamp, writeRamp, type RampStop } from '@/core'
import { cn } from '@/lib/utils'
import { ColorField, NumberField } from './ValueFields'

const css = (c: readonly number[]) => `rgb(${c.map((v) => Math.round(v * 255)).join(' ')})`

const round = (n: number) => Math.round(n * 1000) / 1000

/**
 * The gradient of a Color Ramp: click the bar to add a stop, drag a stop to move it; the
 * selected stop's color, position and removal are below the bar.
 */
export function RampField({ value, onChange }: { value: number[]; onChange: (values: number[]) => void }) {
  const stops = readRamp(value)
  const [selected, setSelected] = useState(0)
  const current = Math.min(selected, stops.length - 1)
  const bar = useRef<HTMLDivElement>(null)
  /** Index of the stop being dragged, kept up to date as it passes others. */
  const dragging = useRef<number | null>(null)

  /** Writes the stops back, sorted, and keeps `stop` selected wherever it lands. */
  const commit = (list: RampStop[], stop: RampStop) => {
    const sorted = [...list].sort((a, b) => a.position - b.position)
    const index = sorted.indexOf(stop)
    setSelected(index)
    if (dragging.current !== null) dragging.current = index
    onChange(writeRamp(sorted))
  }

  const update = (index: number, change: Partial<RampStop>) => {
    const list = [...stops]
    list[index] = { ...list[index], ...change }
    commit(list, list[index])
  }

  const positionAt = (e: PointerEvent) => {
    const rect = bar.current!.getBoundingClientRect()
    return round(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)))
  }

  const startDrag = (e: PointerEvent, index: number) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = index
    setSelected(index)
  }

  const gradient = `linear-gradient(to right, ${stops.map((s) => `${css(s.color)} ${s.position * 100}%`).join(', ')})`

  return (
    <div
      className="nodrag nopan flex flex-col gap-1.5 px-3 pt-1 pb-2"
      style={{ touchAction: 'none' }}
      onPointerMove={(e) => {
        if (dragging.current !== null) update(dragging.current, { position: positionAt(e) })
      }}
      onPointerUp={() => (dragging.current = null)}
      onPointerCancel={() => (dragging.current = null)}
    >
      <div
        ref={bar}
        data-ramp-bar=""
        title="Click to add a color"
        className={cn('h-5 rounded-md border', stops.length < MAX_RAMP_STOPS ? 'cursor-copy' : 'cursor-default')}
        style={{ background: gradient }}
        onPointerDown={(e) => {
          if (stops.length >= MAX_RAMP_STOPS) return
          // A new stop takes the color already there, so the gradient does not change until it is edited.
          const position = positionAt(e)
          const stop: RampStop = { position, color: sampleRamp(stops, position) }
          const list = [...stops, stop]
          const index = [...list].sort((a, b) => a.position - b.position).indexOf(stop)
          startDrag(e, index)
          commit(list, stop)
        }}
      />
      <div className="relative h-3">
        {stops.map((stop, i) => (
          <button
            key={i}
            type="button"
            data-ramp-stop=""
            aria-label={`Color stop at ${stop.position}`}
            aria-pressed={i === current}
            className={cn(
              'absolute top-0 size-3 -translate-x-1/2 cursor-ew-resize rounded-full border-2 border-foreground/70',
              i === current && 'border-selection ring-2 ring-selection/40',
            )}
            style={{ left: `${stop.position * 100}%`, background: css(stop.color) }}
            onPointerDown={(e) => startDrag(e, i)}
          />
        ))}
      </div>
      <div className="flex items-center gap-1">
        <ColorField value={stops[current].color} onChange={(c) => update(current, { color: [c[0], c[1], c[2]] })} />
        <NumberField title="Position" value={stops[current].position} onChange={(n) => update(current, { position: Math.min(1, Math.max(0, n)) })} />
        <button
          type="button"
          aria-label="Remove this color"
          title="Remove this color"
          disabled={stops.length <= MIN_RAMP_STOPS}
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40 [&_svg]:size-3.5"
          onClick={() => {
            const list = stops.filter((_, i) => i !== current)
            setSelected(Math.max(0, current - 1))
            onChange(writeRamp(list))
          }}
        >
          <Trash2 />
        </button>
      </div>
    </div>
  )
}
