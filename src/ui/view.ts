import { useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useGraphStore } from '@/store/graphStore'
import { useUIStore } from '@/store/uiStore'

/**
 * How "fit" frames the graph, wherever it is triggered from. A single node is centered without
 * zooming in more than a little.
 */
const FIT_VIEW = { padding: 0.3, minZoom: 0.5, maxZoom: 1.25, duration: 300 }

/** The nodes a fit frames: the selection (a wire counts for its two ends), else everything. */
function framedNodes(): { id: string }[] | undefined {
  const { graph } = useGraphStore.getState()
  const { selected } = useUIStore.getState()
  const ids = new Set([...selected].filter((id) => graph.nodes[id]))
  for (const e of graph.edges) {
    if (selected.has(e.id)) ids.add(e.from.nodeId).add(e.to.nodeId)
  }
  return ids.size > 0 ? [...ids].map((id) => ({ id })) : undefined
}

/**
 * Frames the selection, or the whole graph when nothing is selected (Ctrl+A then F: see it all).
 * `everything` frames the whole graph whatever is selected (after opening a project).
 */
export function useFit() {
  const { fitView } = useReactFlow()
  return useCallback((everything = false) => void fitView({ ...FIT_VIEW, nodes: everything ? undefined : framedNodes() }), [fitView])
}
