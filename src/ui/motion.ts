import { useEffect, useRef } from 'react'
import { holdPictures } from '@/render/hold'

/**
 * How panels appear and leave, everywhere: a short slide from the edge they sit against, with a
 * fade — eased out on the way in, the same movement backwards on the way out. Nothing else moves.
 *
 * The classes react to `data-state="open" | "closed"`, which Radix sets on its overlays and
 * `Presence` sets on everything else.
 */

// `fill-mode-forwards`: once gone, a panel stays gone until it is removed from the page
// (otherwise it would flash back for an instant at the end of its exit).
const BASE =
  'duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:ease-out data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:ease-in data-[state=closed]:fill-mode-forwards'

export const SLIDE = {
  top: `${BASE} data-[state=open]:slide-in-from-top-4 data-[state=closed]:slide-out-to-top-4`,
  bottom: `${BASE} data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-bottom-4`,
  left: `${BASE} data-[state=open]:slide-in-from-left-4 data-[state=closed]:slide-out-to-left-4`,
  right: `${BASE} data-[state=open]:slide-in-from-right-4 data-[state=closed]:slide-out-to-right-4`,
  /** Covers the whole screen: it has no edge to come from. */
  fade: BASE,
  /** At the bottom of a phone, on the left of a wide screen (the code panel). */
  bottomOrLeft: `${BASE} max-sm:data-[state=open]:slide-in-from-bottom-4 max-sm:data-[state=closed]:slide-out-to-bottom-4 sm:data-[state=open]:slide-in-from-left-4 sm:data-[state=closed]:slide-out-to-left-4`,
  /**
   * A sheet covering the bottom of a phone slides all the way, and stays opaque: what is behind
   * must not show through it while it moves. The same centered box on a wide screen rises a little.
   */
  sheet: `${BASE} max-sm:data-[state=open]:fade-in-100 max-sm:data-[state=open]:slide-in-from-bottom max-sm:data-[state=closed]:fade-out-100 max-sm:data-[state=closed]:slide-out-to-bottom sm:data-[state=open]:slide-in-from-bottom-4 sm:data-[state=closed]:slide-out-to-bottom-4`,
}

/** How long a panel takes to come or go (the `duration-200` above), with a margin. */
export const SLIDE_MS = 250

export type SlideFrom = keyof typeof SLIDE

/**
 * Pauses the pictures (the result and the node previews) while a big panel comes or goes: see
 * `holdPictures`. Not when the page loads, so the result shows at once.
 */
export function useHoldWhileSliding(shown: boolean) {
  const last = useRef(shown)
  useEffect(() => {
    if (last.current === shown) return
    last.current = shown
    holdPictures(SLIDE_MS)
  }, [shown])
}
