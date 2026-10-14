import { useRef, useState } from 'react'

/**
 * A value being changed by a gesture (a drag, typing, the color picker): the field shows every
 * step at once, but the graph only gets the result when the gesture ends. Recompiling the shader,
 * the previews and the code on every pixel of a drag would make it lag.
 */
export function useDraft<T>(value: T, onCommit: (value: T) => void) {
  const [draft, setDraft] = useState<{ value: T } | null>(null)
  // Read by the handler that ends the gesture, which may run before the last step is rendered.
  const last = useRef<{ value: T } | null>(null)

  return {
    /** What the field shows: the draft while there is one, else the value. */
    shown: draft ? draft.value : value,
    pending: draft !== null,
    /** One step of the gesture: shown, not handed over. */
    change: (next: T) => {
      last.current = { value: next }
      setDraft(last.current)
    },
    /** The gesture ends: the graph gets its result (if it changed anything). */
    commit: () => {
      const result = last.current
      last.current = null
      setDraft(null)
      if (result) onCommit(result.value)
    },
    /** The gesture is abandoned: back to the value. */
    cancel: () => {
      last.current = null
      setDraft(null)
    },
  }
}
