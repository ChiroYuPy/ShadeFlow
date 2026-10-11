/**
 * Size, in pixels, of the main preview. Nodes that read the resolution show this
 * value (the node previews themselves are drawn at a fixed small size).
 */
let size: [number, number] = [1280, 720]

export const getMainSize = (): [number, number] => size

export function setMainSize(width: number, height: number) {
  size = [width, height]
}
