import { useState } from 'react'

/**
 * The value, or the last one it had while `current` was true. A panel that is leaving keeps
 * showing what it showed, instead of emptying itself on the way out.
 */
export function useLast<T>(value: T, current: boolean): T {
  const [last, setLast] = useState(value)
  if (current && last !== value) setLast(value)
  return current ? value : last
}
