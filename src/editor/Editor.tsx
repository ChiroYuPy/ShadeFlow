import { useCallback, useEffect, useMemo } from 'react'
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  SelectionMode,
  type Connection,
  type Edge,
  type EdgeChange,
  type FinalConnectionState,
  type IsValidConnection,
  type NodeChange,
  useReactFlow,
  useStore,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { canConnect, concreteType, getNodeDef, GRID, NOTE_TYPE, resolveGenTypes, type ValueType } from '@/core'
import { beginGesture, endGesture, useGraphStore } from '@/store/graphStore'
import { useUIStore } from '@/store/uiStore'
import { pressedByFinger } from '@/ui/pointer'
import { useFit } from '@/ui/view'
import { NoteNode, type NoteFlowNode } from './NoteNode'
import { ShadeNode, type ShadeFlowNode } from './ShadeNode'

type AppNode = ShadeFlowNode | NoteFlowNode

/** Publishes the zoom as `--zoom`, so borders can keep the same on-screen width at any zoom. */
function ZoomVar() {
  const zoom = useStore((s) => s.transform[2])
  const dom = useStore((s) => s.domNode)
  useEffect(() => dom?.style.setProperty('--zoom', String(zoom)), [dom, zoom])
  return null
}

/** Frames the whole graph when asked to (a project was replaced), once its nodes are measured. */
function FitOnRequest() {
  const request = useUIStore((s) => s.fitRequest)
  const fit = useFit()
  useEffect(() => {
    if (request === 0) return
    const t = setTimeout(() => fit(true), 120)
    return () => clearTimeout(t)
  }, [request, fit])
  return null
}

/** Touch is the main pointer: nodes need a tap before they can be dragged. */
const TOUCH = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches

const nodeTypes = { shade: ShadeNode, note: NoteNode }

/** Diameter of the grid's dots. */
const DOT = 1.5

interface EditorProps {
  /** Compile errors by node id. */
  errors: Record<string, string>
}

const toPorts = (c: Connection | Edge) =>
  c.sourceHandle && c.targetHandle
    ? {
        from: { nodeId: c.source, port: c.sourceHandle },
        to: { nodeId: c.target, port: c.targetHandle },
      }
    : null

export function Editor({ errors }: EditorProps) {
  const graph = useGraphStore((s) => s.graph)
  const selected = useUIStore((s) => s.selected)
  const sizes = useUIStore((s) => s.sizes)
  const selectTool = useUIStore((s) => s.tool) === 'select'
  const { screenToFlowPosition } = useReactFlow()

  const genTypes = useMemo(() => resolveGenTypes(graph), [graph])

  const nodes = useMemo<AppNode[]>(() => {
    const connected = new Map<string, string[]>()
    for (const e of graph.edges) connected.set(e.to.nodeId, [...(connected.get(e.to.nodeId) ?? []), e.to.port])
    return Object.values(graph.nodes).map((n): AppNode => {
      const isSelected = selected.has(n.id)
      const base = {
        id: n.id,
        position: n.position,
        selected: isSelected,
        measured: sizes[n.id],
        // On touch screens a node moves only once selected, so pinching or panning over
        // nodes never drags them by accident. With a mouse, dragging is direct.
        draggable: !TOUCH || isSelected,
      }
      if (n.type === NOTE_TYPE) return { ...base, type: 'note', data: { text: n.text ?? '' } }
      return {
        ...base,
        type: 'shade',
        deletable: n.type !== 'output',
        data: {
          nodeType: n.type,
          genType: genTypes[n.id] ?? 'float',
          previewPort: n.previewPort ?? getNodeDef(n.type)?.outputs[0]?.name ?? '',
          showPreview: n.showPreview === true,
          collapsed: n.collapsed === true,
          values: n.values,
          connected: connected.get(n.id) ?? [],
          error: errors[n.id],
        },
      }
    })
  }, [graph, selected, sizes, genTypes, errors])

  const edges = useMemo<Edge[]>(
    () =>
      graph.edges.map((e) => {
        const node = graph.nodes[e.from.nodeId]
        const port = node && getNodeDef(node.type)?.outputs.find((o) => o.name === e.from.port)
        const type: ValueType = port ? concreteType(port.type, genTypes[e.from.nodeId] ?? 'float') : 'float'
        return {
          id: e.id,
          source: e.from.nodeId,
          sourceHandle: e.from.port,
          target: e.to.nodeId,
          targetHandle: e.to.port,
          selected: selected.has(e.id),
          // A selected wire takes the selection color instead of getting thicker.
          style: { stroke: selected.has(e.id) ? 'var(--selection)' : `var(--port-${type})`, strokeWidth: 5.5 },
        }
      }),
    [graph, genTypes, selected],
  )

  const onNodesChange = useCallback((changes: NodeChange<AppNode>[]) => {
    const moves: Record<string, { x: number; y: number }> = {}
    const removed: string[] = []
    const select: [string, boolean][] = []
    const sizes: [string, { width: number; height: number }][] = []
    for (const c of changes) {
      if (c.type === 'position' && c.position) moves[c.id] = c.position
      else if (c.type === 'remove') removed.push(c.id)
      else if (c.type === 'select') select.push([c.id, c.selected])
      else if (c.type === 'dimensions' && c.dimensions) sizes.push([c.id, c.dimensions])
    }
    const store = useGraphStore.getState()
    if (Object.keys(moves).length) store.moveNodes(moves)
    if (removed.length) store.removeNodes(removed)
    if (select.length || sizes.length) useUIStore.getState().applyChanges({ select, sizes })
  }, [])

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    const removed: string[] = []
    const select: [string, boolean][] = []
    for (const c of changes) {
      if (c.type === 'remove') removed.push(c.id)
      else if (c.type === 'select') select.push([c.id, c.selected])
    }
    if (removed.length) useGraphStore.getState().removeEdges(removed)
    if (select.length) useUIStore.getState().applyChanges({ select, sizes: [] })
  }, [])

  // Wire dropped on empty space: offer the nodes that can receive / feed it.
  const onConnectEnd = useCallback(
    (event: globalThis.MouseEvent | TouchEvent, state: FinalConnectionState) => {
      if (state.isValid || state.toHandle || !state.fromHandle?.id) return
      const point = 'changedTouches' in event ? event.changedTouches[0] : event
      const at = screenToFlowPosition({ x: point.clientX, y: point.clientY })
      const anchor = {
        direction: state.fromHandle.type === 'source' ? ('from' as const) : ('to' as const),
        nodeId: state.fromNode.id,
        port: state.fromHandle.id,
      }
      useUIStore.getState().openPalette(at, anchor)
    },
    [screenToFlowPosition],
  )

  const onReconnect = useCallback((oldEdge: Edge, c: Connection) => {
    const ports = toPorts(c)
    if (ports) useGraphStore.getState().reconnect(oldEdge.id, ports.from, ports.to)
  }, [])

  // An existing wire dropped on empty space is removed.
  const onReconnectEnd = useCallback(
    (_: unknown, edge: Edge, _type: unknown, state: FinalConnectionState) => {
      if (!state.isValid && !state.toHandle) useGraphStore.getState().removeEdges([edge.id])
    },
    [],
  )

  const onConnect = useCallback((c: Connection) => {
    const ports = toPorts(c)
    if (ports) useGraphStore.getState().connect(ports.from, ports.to)
  }, [])

  const isValidConnection = useCallback<IsValidConnection>((c) => {
    const ports = toPorts(c)
    return !!ports && canConnect(useGraphStore.getState().graph, ports.from, ports.to)
  }, [])

  const openPaletteAt = (e: { clientX: number; clientY: number; preventDefault: () => void }) => {
    e.preventDefault()
    useUIStore.getState().openPalette(screenToFlowPosition({ x: e.clientX, y: e.clientY }))
  }

  /** The right-click menu, for a mouse: a finger holding still gets nothing (see `pressedByFinger`). */
  const openContextMenu = (e: { clientX: number; clientY: number }, target: 'node' | 'edge' | 'pane', id?: string) =>
    !pressedByFinger() &&
    useUIStore.getState().openContextMenu({
      x: e.clientX,
      y: e.clientY,
      at: screenToFlowPosition({ x: e.clientX, y: e.clientY }),
      target,
      id,
    })

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      isValidConnection={isValidConnection}
      onNodeDragStart={beginGesture}
      onNodeDragStop={endGesture}
      onPaneContextMenu={(e) => {
        e.preventDefault()
        openContextMenu(e, 'pane')
      }}
      onNodeContextMenu={(e, node) => {
        // Holding a finger on a value field is a scrub / edit, not a request for the menu.
        if ((e.target as HTMLElement).closest('input, button, .nodrag')) return
        e.preventDefault()
        if (pressedByFinger()) return
        // Acting on an unselected node means acting on that node alone.
        if (!selected.has(node.id)) useUIStore.getState().setSelection([node.id])
        openContextMenu(e, 'node', node.id)
      }}
      onSelectionContextMenu={(e) => {
        e.preventDefault()
        openContextMenu(e, 'node')
      }}
      onEdgeContextMenu={(e, edge) => {
        e.preventDefault()
        if (pressedByFinger()) return
        useUIStore.getState().setSelection([edge.id])
        openContextMenu(e, 'edge', edge.id)
      }}
      onDoubleClick={(e) => {
        if ((e.target as HTMLElement).classList.contains('react-flow__pane')) openPaletteAt(e)
      }}
      deleteKeyCode={['Backspace', 'Delete']}
      zoomOnDoubleClick={false}
      // A mouse draws a rectangle with Shift. A finger has no Shift: the selection bar arms the
      // rectangle for one drag (React Flow only starts a touch selection when one-finger panning is
      // off), then the finger moves the view again.
      selectionOnDrag={selectTool}
      panOnDrag={!selectTool}
      onSelectionEnd={() => {
        if (selectTool) useUIStore.getState().setTool('pan')
      }}
      selectionMode={SelectionMode.Partial}
      snapToGrid
      snapGrid={[GRID, GRID]}
      onConnectEnd={onConnectEnd}
      onReconnect={onReconnect}
      onReconnectEnd={onReconnectEnd}
      edgesReconnectable
      colorMode="dark"
      fitView
      fitViewOptions={{ padding: 0.3, minZoom: 0.5 }}
      minZoom={0.2}
      proOptions={{ hideAttribution: true }}
    >
      <ZoomVar />
      <FitOnRequest />
      {/* React Flow draws its dots half a cell (plus their radius) off the grid points: the offset
          puts them back on the grid, where the node corners and the pins land. */}
      <Background
        variant={BackgroundVariant.Dots}
        gap={GRID}
        size={DOT}
        offset={(GRID + DOT) / 2}
        color="var(--canvas-dot)"
      />
    </ReactFlow>
  )
}
