import { useState, type ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { SLIDE, type SlideFrom } from './motion'

/**
 * A panel that slides in when `show` turns true and out when it turns false (see `motion.ts`).
 * It stays in the page just long enough to leave.
 */
export function Presence({ show, from, className, ...props }: ComponentProps<'div'> & { show: boolean; from: SlideFrom }) {
  const [present, setPresent] = useState(show)
  if (show && !present) setPresent(true)
  if (!present) return null

  return (
    <div
      {...props}
      data-state={show ? 'open' : 'closed'}
      className={cn(SLIDE[from], className)}
      onAnimationEnd={(e) => {
        // Animations of what is inside bubble up: only our own, on the way out, removes the panel.
        if (!show && e.target === e.currentTarget) setPresent(false)
      }}
    />
  )
}
