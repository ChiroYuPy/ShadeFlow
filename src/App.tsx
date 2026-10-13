import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { compileGraph, generateGLSL } from '@/core'
import { Editor } from '@/editor/Editor'
import type { ShaderStatus } from '@/render/ShaderRenderer'
import { useGraphStore } from '@/store/graphStore'
import { useUIStore } from '@/store/uiStore'
import { Presence } from '@/ui/Presence'
import { Preview } from '@/ui/Preview'
import { ConfirmDialog } from '@/ui/ConfirmDialog'
import { ContextMenu } from '@/ui/ContextMenu'
import { Shortcuts } from '@/ui/Shortcuts'
import { Toolbar } from '@/ui/Toolbar'
import { useLast } from '@/ui/useLast'

// Heavy or rarely used UI is loaded the first time it is needed.
const loadPalette = () => import('@/ui/NodePalette')
const loadCodePanel = () => import('@/ui/CodePanel')
const loadHelp = () => import('@/ui/HelpDialog')
const loadExamples = () => import('@/ui/ExamplesPanel')
const NodePalette = lazy(loadPalette)
const CodePanel = lazy(loadCodePanel)
const HelpDialog = lazy(loadHelp)
const ExamplesPanel = lazy(loadExamples)

const NO_ERRORS: Record<string, string> = {}

function App() {
  const graph = useGraphStore((s) => s.graph)
  const codeOpen = useUIStore((s) => s.codeOpen)
  const paletteOpen = useUIStore((s) => s.palette.open)
  const helpOpen = useUIStore((s) => s.helpOpen)
  const examplesOpen = useUIStore((s) => s.examplesOpen)
  // Overlays are loaded when first opened, then kept: they animate out by themselves.
  const [paletteUsed, setPaletteUsed] = useState(false)
  if (paletteOpen && !paletteUsed) setPaletteUsed(true)
  const [examplesUsed, setExamplesUsed] = useState(false)
  if (examplesOpen && !examplesUsed) setExamplesUsed(true)
  const [helpUsed, setHelpUsed] = useState(false)
  if (helpOpen && !helpUsed) setHelpUsed(true)
  const resultOpen = useUIStore((s) => s.resultOpen)
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

  // Fetch the lazy parts as soon as the editor is up, so opening them later is instant.
  useEffect(() => {
    const t = setTimeout(() => void Promise.all([loadPalette(), loadCodePanel(), loadHelp(), loadExamples()]), 200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => useUIStore.getState().setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  // What the graphics card says is only known (and up to date) while the result is drawn.
  const globalError =
    result.diagnostics.filter((d) => !d.nodeId).map((d) => d.message).join('\n') ||
    (resultOpen && status && !status.ok ? status.log : '')
  // Panels that are leaving keep their last content.
  const shownNotice = useLast(notice, notice !== null)
  const errorAlone = globalError !== '' && !resultOpen
  const shownError = useLast(globalError, errorAlone)

  return (
    <div className="relative h-full overflow-hidden">
      <ReactFlowProvider>
        <Editor errors={errors} />
        <Shortcuts />
        <Toolbar />
        <ContextMenu />
        <ConfirmDialog />
        <Suspense fallback={null}>
          {paletteUsed && <NodePalette />}
          {examplesUsed && <ExamplesPanel />}
        </Suspense>
      </ReactFlowProvider>

      <Presence
        show={codeOpen}
        from="bottomOrLeft"
        // As tall as its code needs on a wide screen, up to the bars below.
        className="absolute inset-x-3 bottom-32 flex h-[40%] flex-col sm:inset-x-auto sm:top-[4.25rem] sm:bottom-auto sm:left-4 sm:h-auto sm:max-h-[calc(100%-9rem)] sm:w-[26rem]"
      >
        <Suspense fallback={null}>
          <CodePanel ir={result.ok ? result.ir : null} />
        </Suspense>
      </Presence>
      <Suspense fallback={null}>{helpUsed && <HelpDialog />}</Suspense>
      <Preview code={glsl} onStatus={setStatus} error={globalError || (result.ok ? '' : 'The graph has an error, see the highlighted node.')} />

      {/* The result panel shows the error itself; hidden, the error still has to be seen. */}
      <Presence
        show={errorAlone}
        from="right"
        className="absolute top-3 right-3 max-w-[min(30rem,90%)] rounded-lg border border-destructive bg-card/90 p-3 sm:top-4 sm:right-4"
      >
        <pre className="text-xs whitespace-pre-wrap text-destructive">{shownError}</pre>
      </Presence>
      <Presence
        show={notice !== null}
        from="bottom"
        className="absolute bottom-32 left-1/2 -translate-x-1/2 rounded-lg border bg-card px-3 py-2 text-sm shadow-lg"
      >
        {shownNotice}
      </Presence>
    </div>
  )
}

export default App
