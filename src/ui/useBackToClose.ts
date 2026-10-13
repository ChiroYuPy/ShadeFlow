import { useEffect, useRef } from 'react'

/**
 * Lets the browser's Back button (the system one on phones) close what is open instead of
 * leaving the site: while something is open, the page sits on an extra history entry, so
 * Back only removes that entry — and we close the innermost thing.
 */

const MARK = 'shadeflowOverlay'

/** What is open, innermost last. */
const open: { close: () => void }[] = []
/** Back navigations we triggered ourselves, to drop the extra entry: they must not close anything. */
let ignored = 0

/**
 * Names the entries added since this page was loaded. An entry left over from before a reload
 * belongs to the previous page: going back from it would load that page again, so it is not ours.
 */
const LOAD = Math.random().toString(36).slice(2)

const onExtraEntry = () => (history.state as Record<string, unknown> | null)?.[MARK] === LOAD

function addEntry() {
  if (!onExtraEntry()) history.pushState({ [MARK]: LOAD }, '')
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    if (ignored > 0) {
      ignored--
      return
    }
    open.pop()?.close()
    if (open.length > 0) addEntry() // something else is still open: Back closes it next
  })
}

export function useBackToClose(isOpen: boolean, close: () => void) {
  const latest = useRef(close)
  useEffect(() => {
    latest.current = close
  })

  useEffect(() => {
    if (!isOpen) return
    const entry = { close: () => latest.current() }
    open.push(entry)
    addEntry()
    return () => {
      const index = open.indexOf(entry)
      if (index !== -1) open.splice(index, 1)
      // Closed from the interface: drop the extra entry, once things have settled (something
      // may open right away, and a navigation must not race with it).
      setTimeout(() => {
        if (open.length > 0 || !onExtraEntry()) return
        ignored++
        history.back()
      })
    }
  }, [isOpen])
}
