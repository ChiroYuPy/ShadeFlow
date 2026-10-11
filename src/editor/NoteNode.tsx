import { memo, useLayoutEffect, useRef } from 'react'
import type { Node, NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'
import { editText } from '@/store/graphStore'

export type NoteFlowNode = Node<{ text: string }, 'note'>

/** Free-text annotation. It is part of the project but never compiled. */
function NoteNodeImpl({ id, data, selected }: NodeProps<NoteFlowNode>) {
  const ref = useRef<HTMLTextAreaElement>(null)

  // Grow with the content.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = '0'
    el.style.height = `${el.scrollHeight}px`
  }, [data.text])

  return (
    <div className={cn('w-56 rounded-lg border border-dashed bg-card/70 p-2 shadow-lg', selected && 'ring-[length:var(--node-ring)] ring-ring')}>
      <textarea
        ref={ref}
        rows={2}
        value={data.text}
        placeholder="Write a note…"
        onChange={(e) => editText(id, e.target.value)}
        className="nodrag nopan nowheel block w-full resize-none bg-transparent text-sm leading-snug outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}

export const NoteNode = memo(NoteNodeImpl)
