/**
 * Where the pointer is over the result, in UV units: (0, 0) is the bottom-left corner
 * and (1, 1) the top-right one. Shared by every renderer, like the time. It stays where
 * the pointer last was, and starts in the middle.
 */
let mouse: [number, number] = [0.5, 0.5]

export const getMouse = (): [number, number] => mouse

export function setMouse(x: number, y: number) {
  mouse = [x, y]
}
