import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { compileGraph, generateGLSL } from '@/core'
import { Editor } from '@/editor/Editor'
import type { ShaderStatus } from '@/render/ShaderRenderer'
import { copySelection, cutSelection, duplicateSelection, pasteText, selectAll } from '@/store/fileActions'
import { redo, undo, useGraphStore } from '@/store/graphStore'
import { useUIStore } from '@/store/uiStore'
import { Preview } from '@/ui/Preview'
import { ConfirmDialog } from '@/ui/ConfirmDialog'
import { ContextMenu } from '@/ui/ContextMenu'
import { Toolbar } from '@/ui/Toolbar'

// Heavy or rarely used UI is loaded the first time it is needed.
const loadPalette = () => import('@/ui/NodePalette')
const loadCodePanel = () => import('@/ui/CodePanel')
const loadHelp = () => import('@/ui/HelpDialog')
const NodePalette = lazy(loadPalette)
const CodePanel = lazy(loadCodePanel)
const HelpDialog = lazy(loadHelp)

const NO_ERRORS: Record<string, string> = {}

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
}

/** Number fields have no text history worth keeping: Ctrl+Z there undoes the graph. */
const isNumberField = (target: EventTarget | null) => target instanceof HTMLElement && 'numberField' in target.dataset

function App() {
  const graph = useGraphStore((s) => s.graph)
  const codeOpen = useUIStore((s) => s.codeOpen)
  const paletteOpen = useUIStore((s) => s.palette.open)
  const helpOpen = useUIStore((s) => s.helpOpen)
  const notice = useUIStore((s) => s.notice)
  const result = useMemo(() => compileGraph(graph, { diagnoseAll: true }), [graph])
  const glsl = useMemo(() => (result.ok ? generateGLSL(result.ir) : null), [result])
  const [status, setStatus] = useState<ShaderStatus | null>(null)

  // Every broken node gets its own message, even when it does not feed the Output yet.
  const errors = useMemo(() => {
    if (result.diagnostics.length === 0) return NO_ERRORS
    const byNode: Record<string, string[]> = {}
    for (const d of result.diagnostics) if (d.nodeId) (byNode[d.nodeId] ??= []).push(d.message)
    return Object.fromEntries(Object.entries(byNode).map(([id, messages]) => [id, messages.join('\n')]))
  }, [result])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const ui = useUIStore.getState()
      if (!e.ctrlKey && !e.metaKey && !e.altKey && !isTyping(e.target)) {
        if (e.key === 'v') ui.setTool('select')
        else if (e.key === 'h') ui.setTool('pan')
      }
      if (e.key === 'Escape' && ui.previewFullscreen) {
        ui.setPreviewFullscreen(false)
        return
      }
      if (e.key === '?' && !isTyping(e.target) && !e.ctrlKey && !e.metaKey) {
        ui.setHelpOpen(!ui.helpOpen)
        return
      }
      if (!(e.ctrlKey || e.metaKey)) return
      const key = e.key.toLowerCase()
      // Leaving the field drops its typed draft, so it shows the restored value after an undo.
      if (isNumberField(e.target) && (key === 'z' || key === 'y')) (e.target as HTMLElement).blur()
      if (key === 'k') {
        e.preventDefault()
        ui.openPalette()
      } else if (key === 'a' && !isTyping(e.target)) {
        e.preventDefault()
        selectAll()
      } else if (key === 'd' && !isTyping(e.target)) {
        e.preventDefault() // the browser would bookmark the page
        duplicateSelection()
      } else if (isTyping(e.target) && !isNumberField(e.target)) {
        return // let text fields use their own undo
      } else if (key === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (key === 'y') {
        e.preventDefault()
        redo()
      }
    }

    // Copy / cut / paste go through the browser's clipboard events, so they work
    // across tabs and never fight with text fields (which handle their own).
    const onCopy = (e: ClipboardEvent) => {
      if (isTyping(e.target)) return
      const text = copySelection()
      if (text === null) return
      e.clipboardData?.setData('text/plain', text)
      e.preventDefault()
    }
    const onCut = (e: ClipboardEvent) => {
      if (isTyping(e.target)) return
      const text = cutSelection()
      if (text === null) return
      e.clipboardData?.setData('text/plain', text)
      e.preventDefault()
    }
    const onPaste = (e: ClipboardEvent) => {
      if (isTyping(e.target)) return
      const text = e.clipboardData?.getData('text/plain')
      if (text && pasteText(text)) e.preventDefault()
    }

    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('copy', onCopy)
    document.addEventListener('cut', onCut)
    document.addEventListener('paste', onPaste)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('copy', onCopy)
      document.removeEventListener('cut', onCut)
      document.removeEventListener('paste', onPaste)
    }
  }, [])

  // Fetch the lazy parts as soon as the editor is up, so opening them later is instant.
  useEffect(() => {
    const t = setTimeout(() => void Promise.all([loadPalette(), loadCodePanel(), loadHelp()]), 200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => useUIStore.getState().setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  const globalError =
    result.diagnostics.filter((d) => !d.nodeId).map((d) => d.message).join('\n') ||
    (status && !status.ok ? status.log : '')

  return (
    <div className="relative h-full overflow-hidden">
      <ReactFlowProvider>
        <Editor errors={errors} />
        <Toolbar />
        <ContextMenu />
        <ConfirmDialog />
        <Suspense fallback={null}>{paletteOpen && <NodePalette />}</Suspense>
      </ReactFlowProvider>

      <Suspense fallback={null}>
        {codeOpen && <CodePanel ir={result.ok ? result.ir : null} />}
        {helpOpen && <HelpDialog />}
      </Suspense>
      <Preview code={glsl} onStatus={setStatus} failed={!!globalError || !result.ok} />

      {globalError && (
        <pre className="absolute top-28 right-3 max-w-[min(30rem,90%)] sm:top-44 sm:right-4 rounded-lg border border-destructive bg-card/90 p-3 text-xs whitespace-pre-wrap text-destructive">
          {globalError}
        </pre>
      )}
      {notice && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-lg border bg-card px-3 py-2 text-sm shadow-lg">
          {notice}
        </div>
      )}
    </div>
  )
}

export default App
