/**
 * The parts every panel shares, so they all look alike: the box itself is the `panel` utility
 * (`index.css`), these are what goes inside it.
 */

/** The top row of a panel: its title or search, its actions, its close button. */
export const PANEL_HEADER = 'flex shrink-0 items-center gap-1 border-b p-2'

/** A panel's title, in its header. */
export const PANEL_TITLE = 'min-w-0 flex-1 truncate px-2 font-medium'

/** An icon button of a panel: big enough for a thumb on a phone, compact on a wide screen. */
export const PANEL_BUTTON =
  'flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 sm:size-8 [&_svg]:size-5 sm:[&_svg]:size-4'
