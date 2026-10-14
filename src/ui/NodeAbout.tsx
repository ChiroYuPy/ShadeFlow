import { createElement } from 'react'
import { getNodeDef } from '@/core'
import { CATEGORY_LABELS, CATEGORY_TEXT, nodeIcon } from '@/editor/nodeLook'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/uiStore'
import { NodeDetails } from './NodeDetails'
import { Overlay, OverlayHeader } from './Overlay'
import { PANEL_TITLE } from './panel'
import { useLast } from './useLast'

const close = () => useUIStore.getState().setAbout(null)

/** "About this node": what a node of the graph does, readable on a phone too (no hover there). */
export default function NodeAbout() {
  const about = useUIStore((s) => s.about)
  // While it leaves, it keeps showing the node it was about.
  const def = getNodeDef(useLast(about, about !== null) ?? '')

  return (
    <Overlay open={about !== null} onClose={close} title={def ? `About ${def.label}` : 'About'} data-about="" className="sm:w-[28rem]">
      {def && (
        <>
          <OverlayHeader>
            {createElement(nodeIcon(def.type), { className: cn('ml-2 size-5 shrink-0', CATEGORY_TEXT[def.category]) })}
            <h2 className={PANEL_TITLE}>{def.label}</h2>
            <span className={cn('pr-1 text-xs', CATEGORY_TEXT[def.category])}>{CATEGORY_LABELS[def.category]}</span>
          </OverlayHeader>
          <NodeDetails description={def.description} def={def} className="overflow-y-auto overscroll-contain p-4" />
        </>
      )}
    </Overlay>
  )
}
