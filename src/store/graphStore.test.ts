import { beforeEach, describe, expect, it } from 'vitest'
import { duplicateSelection } from './fileActions'
import { useUIStore } from './uiStore'
import { beginGesture, editText, editValue, endGesture, redo, undo, useGraphStore } from './graphStore'

const temporal = () => useGraphStore.temporal.getState()
const pos = (id: string) => useGraphStore.getState().graph.nodes[id].position

describe('graph store history', () => {
  beforeEach(() => {
    temporal().clear()
  })

  it('undoes and redoes a structural change', () => {
    const { removeNodes } = useGraphStore.getState()
    const before = useGraphStore.getState().graph
    removeNodes(['mix'])
    expect(useGraphStore.getState().graph.nodes.mix).toBeUndefined()
    // wires touching the node go with it
    expect(useGraphStore.getState().graph.edges.some((e) => e.from.nodeId === 'mix' || e.to.nodeId === 'mix')).toBe(false)
    undo()
    expect(useGraphStore.getState().graph).toEqual(before)
    redo()
    expect(useGraphStore.getState().graph.nodes.mix).toBeUndefined()
    undo()
  })

  it('resets a node to its default values, undoably', () => {
    const store = useGraphStore.getState()
    store.setValue('uv', 'x', [5])
    store.resetValues('uv')
    expect(useGraphStore.getState().graph.nodes.uv.values).toEqual({})
    undo()
    expect(useGraphStore.getState().graph.nodes.uv.values).toEqual({ x: [5] })
    undo()
  })

  it('records a whole drag as one undo step', () => {
    const start = pos('uv')
    beginGesture()
    for (let i = 1; i <= 5; i++) useGraphStore.getState().moveNodes({ uv: { x: i * 10, y: 0 } })
    endGesture()
    expect(pos('uv')).toEqual({ x: 50, y: 0 })
    undo()
    expect(pos('uv')).toEqual(start)
    redo()
    expect(pos('uv')).toEqual({ x: 50, y: 0 })
    undo()
  })

  it('refuses to delete the Output node', () => {
    useGraphStore.getState().removeNodes(['out'])
    expect(useGraphStore.getState().graph.nodes.out).toBeDefined()
  })

  it('replaces the wire on an input and ignores invalid connections', () => {
    const { connect } = useGraphStore.getState()
    const edgesInto = (id: string, port: string) =>
      useGraphStore.getState().graph.edges.filter((e) => e.to.nodeId === id && e.to.port === port)
    connect({ nodeId: 'colorB', port: 'color' }, { nodeId: 'mix', port: 'a' })
    expect(edgesInto('mix', 'a')).toHaveLength(1)
    expect(edgesInto('mix', 'a')[0].from.nodeId).toBe('colorB')
    const count = useGraphStore.getState().graph.edges.length
    connect({ nodeId: 'uv', port: 'uv' }, { nodeId: 'out', port: 'color' }) // vec2 → vec3
    expect(useGraphStore.getState().graph.edges).toHaveLength(count)
    undo()
  })

  it('groups consecutive edits of one field into one undo step', () => {
    const before = useGraphStore.getState().graph.nodes.speed.values.b
    editValue('speed', 'b', [1])
    editValue('speed', 'b', [1.5])
    editValue('speed', 'b', [1.55])
    expect(useGraphStore.getState().graph.nodes.speed.values.b).toEqual([1.55])
    undo()
    expect(useGraphStore.getState().graph.nodes.speed.values.b).toEqual(before)
  })

  it('keeps edits of different fields as separate undo steps', () => {
    const before = useGraphStore.getState().graph
    editValue('speed', 'b', [2])
    editValue('scaleX', 'b', [5])
    undo()
    expect(useGraphStore.getState().graph.nodes.scaleX.values.b).toEqual(before.nodes.scaleX.values.b)
    expect(useGraphStore.getState().graph.nodes.speed.values.b).toEqual([2])
    undo()
    expect(useGraphStore.getState().graph.nodes.speed.values.b).toEqual(before.nodes.speed.values.b)
  })

  it('creates notes with text and edits it', () => {
    const id = useGraphStore.getState().addNode('note', { x: 0, y: 0 })
    expect(useGraphStore.getState().graph.nodes[id].text).toBe('')
    editText(id, 'hello')
    expect(useGraphStore.getState().graph.nodes[id].text).toBe('hello')
    undo()
    undo()
  })

  it('duplicates a selection as a single undo step, wires included', () => {
    const before = useGraphStore.getState().graph
    useUIStore.getState().setSelection(['uv', 'split', 'out']) // Output is never copied
    duplicateSelection()
    const after = useGraphStore.getState().graph
    expect(Object.keys(after.nodes)).toHaveLength(Object.keys(before.nodes).length + 2)
    expect(after.edges).toHaveLength(before.edges.length + 1) // uv → split
    expect(Object.values(after.nodes).filter((n) => n.type === 'output')).toHaveLength(1)
    // the copies are selected, and moved away from the originals
    const selected = [...useUIStore.getState().selected]
    expect(selected).toHaveLength(2)
    expect(selected.every((id) => !(id in before.nodes))).toBe(true)
    undo()
    expect(useGraphStore.getState().graph).toEqual(before)
    useUIStore.getState().setSelection([])
  })

  it('toggles previews and folding as undoable changes', () => {
    const { togglePreview, toggleCollapsed, addNode } = useGraphStore.getState()
    const id = addNode('sin', { x: 0, y: 0 }) // new nodes start without a preview
    const node = () => useGraphStore.getState().graph.nodes[id]
    expect(node().showPreview).toBeFalsy()
    togglePreview(id)
    expect(node().showPreview).toBe(true)
    toggleCollapsed(id)
    expect(node().collapsed).toBe(true)
    undo()
    expect(node().collapsed).toBeFalsy()
    undo()
    expect(node().showPreview).toBeFalsy()
    undo() // the node itself
  })
})
