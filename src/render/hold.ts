/**
 * Pauses every picture for a moment, while a panel slides in or out: redrawing the result and many
 * animated previews each frame takes the time (and, on a phone, the GPU) the slide needs to stay
 * smooth. A held picture keeps showing its last frame. Shared by every renderer, like the time.
 */
let heldUntil = 0

export function holdPictures(ms: number) {
  heldUntil = Math.max(heldUntil, performance.now() + ms)
}

export const picturesHeld = (now = performance.now()) => now < heldUntil
