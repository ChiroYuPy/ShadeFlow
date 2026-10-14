import { useRef, useState } from 'react'
import { componentCount, type ValueType } from '@/core'
import { cn } from '@/lib/utils'

const AXES = ['x', 'y', 'z', 'w']

const round = (n: number) => Math.round(n * 10000) / 10000
const format = (n: number) => String(round(n))

/** Pixels of horizontal drag before a press becomes a scrub instead of a click. */
const SCRUB_THRESHOLD = 3
/** Value change per pixel; Shift is coarse, Alt is fine. */
const SCRUB_STEP = 0.01
/** Same, for whole numbers: a count should not race through its few values. */
const WHOLE_SCRUB_STEP = 0.05

interface Whole {
  min: number
  max: number
}

/**
 * A compact number field. Drag horizontally to change the value (also works with touch
 * and gives access to negative numbers on keypads without a minus sign); click to type.
 */
export function NumberField({
  title,
  value,
  whole,
  onChange: emit,
}: {
  /** Tooltip, e.g. the axis of a vector. */
  title?: string
  value: number
  /** Only whole numbers within these bounds. */
  whole?: Whole
  onChange: (n: number) => void
}) {
  const onChange = (n: number) => emit(whole ? Math.min(whole.max, Math.max(whole.min, Math.round(n))) : n)
  // While typing, keep the raw text so "-" or "0." are not rewritten under the cursor.
  const [draft, setDraft] = useState<string | null>(null)
  const scrub = useRef<{ x: number; value: number; moved: boolean } | null>(null)

  return (
    <div className="min-w-0 flex-1">
      <input
        type="text"
        data-number-field=""
        inputMode="decimal"
        title={title ? `${title}: drag to change, click to type` : 'Drag to change, click to type'}
        className={cn(
          'nodrag nopan nowheel h-6 w-full min-w-0 cursor-ew-resize rounded-md bg-background/70 px-1.5 text-right text-xs tabular-nums',
          'outline-none focus:cursor-text focus:ring-1 focus:ring-ring',
        )}
        style={{ touchAction: 'none' }}
        value={draft ?? format(value)}
        onBlur={() => setDraft(null)}
        // Not focused yet: take over the press so a drag scrubs instead of placing a caret.
        onMouseDown={(e) => {
          if (document.activeElement !== e.currentTarget) e.preventDefault()
        }}
        onPointerDown={(e) => {
          if (document.activeElement === e.currentTarget) return
          scrub.current = { x: e.clientX, value, moved: false }
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          const s = scrub.current
          if (!s) return
          const dx = e.clientX - s.x
          if (!s.moved && Math.abs(dx) < SCRUB_THRESHOLD) return
          s.moved = true
          setDraft(null)
          const speed = (whole ? WHOLE_SCRUB_STEP : SCRUB_STEP) * (e.shiftKey ? 10 : e.altKey ? 0.1 : 1)
          onChange(round(s.value + dx * speed))
        }}
        onPointerUp={(e) => {
          const s = scrub.current
          scrub.current = null
          if (s && !s.moved) {
            e.currentTarget.focus()
            e.currentTarget.select()
          }
        }}
        onChange={(e) => {
          setDraft(e.target.value)
          const n = Number(e.target.value.replace(',', '.'))
          if (e.target.value.trim() !== '' && Number.isFinite(n)) onChange(n)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
          e.preventDefault()
          const step = (whole || e.shiftKey ? 1 : 0.1) * (e.key === 'ArrowUp' ? 1 : -1)
          setDraft(null)
          onChange(round(value + step))
        }}
      />
    </div>
  )
}

const toHex = (rgb: number[]) =>
  '#' + [0, 1, 2].map((i) => Math.round(Math.min(1, Math.max(0, rgb[i] ?? 0)) * 255).toString(16).padStart(2, '0')).join('')

const fromHex = (hex: string) => [1, 3, 5].map((i) => Math.round((parseInt(hex.slice(i, i + 2), 16) / 255) * 1000) / 1000)

/** Color field: hex code and swatch. The whole field opens the picker. */
export function ColorField({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  const hex = toHex(value)
  return (
    <label className="nodrag nopan relative flex h-6 min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded-md bg-background/70 px-1.5 text-xs">
      <span className="ml-auto tabular-nums text-muted-foreground uppercase">{hex.slice(1)}</span>
      <span className="size-3.5 rounded-sm border" style={{ background: hex }} />
      <input
        type="color"
        value={hex}
        onChange={(e) => onChange(fromHex(e.target.value))}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
      />
    </label>
  )
}

interface PortValueProps {
  type: ValueType
  value: number[]
  widget?: 'color' | 'ramp'
  whole?: Whole
  onChange: (value: number[]) => void
}

/** The editor of an unwired input, sized to sit on the same row as the port's label. */
export function PortValue({ type, value, widget, whole, onChange }: PortValueProps) {
  if (widget === 'color' && type === 'vec3') return <ColorField value={value} onChange={onChange} />
  if (type === 'float') return <NumberField value={value[0] ?? 0} whole={whole} onChange={(n) => onChange([n])} />
  return (
    <div className="flex min-w-0 flex-1 gap-1">
      {AXES.slice(0, componentCount[type]).map((axis, i) => (
        <NumberField
          key={axis}
          title={axis.toUpperCase()}
          value={value[i] ?? 0}
          onChange={(n) => onChange(value.map((v, j) => (j === i ? n : v)))}
        />
      ))}
    </div>
  )
}
