/**
 * The stops of a Color Ramp, as stored in the node's values: one flat list of numbers,
 * four per stop (position, then red, green and blue), like every other value of a node.
 */

export interface RampStop {
  /** Where the color sits, from 0 to 1. */
  position: number
  color: [number, number, number]
}

export const MIN_RAMP_STOPS = 2
export const MAX_RAMP_STOPS = 8

/** Black to white, the starting point of a new Color Ramp. */
export const DEFAULT_RAMP: number[] = [0, 0, 0, 0, 1, 1, 1, 1]

const clamp01 = (n: number) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0))

/** The stops in the stored list, sorted by position. Anything unusable falls back to the default. */
export function readRamp(values: readonly number[] | undefined): RampStop[] {
  const list = values && values.length >= MIN_RAMP_STOPS * 4 ? values : DEFAULT_RAMP
  const stops: RampStop[] = []
  for (let i = 0; i + 3 < list.length && stops.length < MAX_RAMP_STOPS; i += 4) {
    stops.push({ position: clamp01(list[i]), color: [clamp01(list[i + 1]), clamp01(list[i + 2]), clamp01(list[i + 3])] })
  }
  // A stable sort: two stops at the same place keep their order.
  return stops.sort((a, b) => a.position - b.position)
}

export function writeRamp(stops: readonly RampStop[]): number[] {
  return stops.flatMap((s) => [s.position, ...s.color])
}

/** The color of the ramp at `t` (what the shader computes), e.g. for a new stop added there. */
export function sampleRamp(stops: readonly RampStop[], t: number): [number, number, number] {
  let color = stops[0].color
  for (let i = 1; i < stops.length; i++) {
    const f = clamp01((t - stops[i - 1].position) / Math.max(stops[i].position - stops[i - 1].position, 1e-5))
    color = [0, 1, 2].map((c) => color[c] + (stops[i].color[c] - color[c]) * f) as [number, number, number]
  }
  return color
}
