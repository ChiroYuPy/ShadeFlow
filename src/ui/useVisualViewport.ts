import { useEffect } from 'react'

/**
 * Publishes the visible part of the page as `--vv-height` / `--vv-top`. On phones the
 * on-screen keyboard shrinks the visual viewport but not the layout one, so anything
 * sized with `100dvh` would end up hidden behind the keyboard.
 */
export function useVisualViewportVars() {
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const root = document.documentElement
    const update = () => {
      root.style.setProperty('--vv-height', `${viewport.height}px`)
      root.style.setProperty('--vv-top', `${viewport.offsetTop}px`)
    }
    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
      root.style.removeProperty('--vv-height')
      root.style.removeProperty('--vv-top')
    }
  }, [])
}
