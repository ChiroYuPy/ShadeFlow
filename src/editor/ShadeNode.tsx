import { createElement, memo } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { ChevronDown, Eye, EyeOff } from 'lucide-react'
import { coerceConstant, concreteType, getNodeDef, type ValueType } from '@/core'
import { cn } from '@/lib/utils'
import { editValue, useGraphStore } from '@/store/graphStore'
import { NodePreview } from './NodePreview'
import { CATEGORY_TEXT, nodeIcon } from './nodeLook'
import { RampField } from './RampField'
import { PortValue } from './ValueFields'

type NodeData = {
  nodeType: string
  /** Resolved type of the node's generic ports. */
  genType: ValueType
  /** Values of unwired inputs, as stored in the graph. */
  values: Record<string, number[]>
  /** Names of inputs that have a wire. */
  connected: string[]
  /** The node shows its live preview. */
  showPreview: boolean
  /** Folded: only the header and the plugs in use remain. */
  collapsed: boolean
  /** Output shown in the node's preview. */
  previewPort: string
  /** Compile error attached to this node, if any. */
  error?: string
}

export type ShadeFlowNode = Node<NodeData, 'shade'>

/** Pins are centered on the middle of the node's ring, which sits just outside the box. */
const PIN_OFFSET = 'calc(var(--node-ring) / -2)'

const handleStyle = (type: ValueType, side: 'left' | 'right') => ({
  width: 'var(--handle-size)',
  height: 'var(--handle-size)',
  background: `var(--port-${type})`,
  border: '2px solid var(--node)',
  [side]: PIN_OFFSET,
})

function ShadeNodeImpl({ id, data, selected }: NodeProps<ShadeFlowNode>) {
  const def = getNodeDef(data.nodeType)
  if (!def) {
    return <div className="rounded-lg border border-destructive bg-node px-3 py-2 text-sm">Unknown node</div>
  }

  // The Output node is a sink: its single "output" only feeds the compiler.
  const outputs = def.type === 'output' ? [] : def.outputs
  const canPreview = def.type !== 'output' && def.preview !== 'none'
  const showPreview = canPreview && data.showPreview && !data.collapsed
  const store = useGraphStore.getState

  return (
    <div
      // The outline is a ring (outside the box) rather than a border, so the header can be
      // flush with the node's rounded corners.
      className={cn(
        'group w-52 rounded-xl bg-node text-sm shadow-lg ring-[length:var(--node-ring)] ring-node-border',
        selected && 'ring-selection',
        data.error && 'ring-destructive',
      )}
    >
      <div className="flex h-9 items-center gap-2 rounded-t-xl bg-node-header pr-2 pl-2 font-medium">
        {createElement(nodeIcon(def.type), { className: cn('size-5 shrink-0', CATEGORY_TEXT[def.category]) })}
        <span className="min-w-0 flex-1 truncate">{def.label}</span>
        {canPreview && (
          <button
            type="button"
            aria-label={data.showPreview ? 'Hide preview' : 'Show preview'}
            title={data.showPreview ? 'Hide preview' : 'Show preview'}
            className={cn(
              'nodrag flex size-5 shrink-0 items-center justify-center rounded hover:text-foreground',
              data.showPreview ? 'text-foreground' : 'text-muted-foreground',
              // Hidden previews are the default: their crossed eye only shows where the node is being looked at.
              !data.showPreview && !selected && 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
            )}
            onClick={() => store().togglePreview(id)}
          >
            {data.showPreview ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          </button>
        )}
        <button
          type="button"
          aria-label={data.collapsed ? 'Unfold node' : 'Fold node'}
          title={data.collapsed ? 'Unfold' : 'Fold'}
          className="nodrag flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
          onClick={() => store().toggleCollapsed(id)}
        >
          <ChevronDown className={cn('size-4 transition-transform', data.collapsed && '-rotate-90')} />
        </button>
      </div>

      {data.error && <div className="px-3 pt-1.5 text-xs text-destructive">{data.error}</div>}
      <div className="py-1.5">
        {outputs.map((port) => {
          // With several outputs, the label picks which one the preview shows.
          const pickable = showPreview && outputs.length > 1
          const active = pickable && port.name === data.previewPort
          return (
            <div key={port.name} className="relative flex h-7 items-center justify-end px-3">
              <span
                className={cn(
                  'flex items-center gap-1.5',
                  active ? 'text-foreground' : 'text-muted-foreground',
                  pickable && 'nodrag cursor-pointer hover:text-foreground',
                )}
                title={pickable ? 'Show this output in the preview' : undefined}
                onClick={pickable ? () => store().setPreviewPort(id, port.name) : undefined}
              >
                {active && <span className="size-1.5 rounded-full bg-foreground" />}
                {port.label}
              </span>
              <Handle
                id={port.name}
                type="source"
                position={Position.Right}
                style={handleStyle(concreteType(port.type, data.genType), 'right')}
              />
            </div>
          )
        })}

        {def.inputs.map((port) => {
          const type = concreteType(port.type, data.genType)
          const connectable = port.connectable !== false
          const wired = data.connected.includes(port.name)
          // Folded nodes keep only the plugs that are in use.
          if (data.collapsed && !wired) return null

          // A Color Ramp's gradient takes the whole width, below its label.
          if (port.widget === 'ramp') {
            return (
              <RampField
                key={port.name}
                value={data.values[port.name] ?? (port.default as number[])}
                onChange={(v) => editValue(id, port.name, v)}
              />
            )
          }

          // Unwired, a position is the pixel's UV: nothing to edit, the row just says so.
          const usesUV = port.default === 'uv' && !wired
          const editable = port.default !== 'uv' && (!connectable || !wired)

          // One row per input: its label, then (when nothing is wired in) its value.
          return (
            <div key={port.name} className="relative flex h-7 items-center gap-2 px-3">
              {connectable && (
                <Handle id={port.name} type="target" position={Position.Left} style={handleStyle(type, 'left')} />
              )}
              <span className="shrink-0 text-muted-foreground">{port.label}</span>
              {usesUV && (
                <span className="ml-auto text-xs text-muted-foreground" title="Nothing is wired in: the pixel's UV is used">
                  {type === 'float' ? 'UV x' : 'UV'}
                </span>
              )}
              {editable && port.default !== 'uv' && (
                <PortValue
                  type={type}
                  widget={port.widget}
                  whole={port.whole}
                  value={coerceConstant(data.values[port.name] ?? port.default, type)}
                  onChange={(v) => editValue(id, port.name, v)}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Last, so showing or hiding it never moves the pins (nor the wires). */}
      {showPreview && (
        <div className="px-2 pb-2">
          <NodePreview nodeId={id} />
        </div>
      )}
    </div>
  )
}

export const ShadeNode = memo(ShadeNodeImpl)
