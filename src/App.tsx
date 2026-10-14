import { useEffect, useMemo, useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { compileGraph, generateGLSL } from '@/core'
import { Editor } from '@/editor/Editor'
import type { ShaderStatus } from '@/render/ShaderRenderer'
import { useGraphStore } from '@/store/graphStore'
import { useUIStore } from '@/store/uiStore'
import { previewHub } from '@/render/previewHub'
import { SLIDE_MS } from '@/ui/motion'
import { Presence } from '@/ui/Presence'
import { Preview } from '@/ui/Preview'
import { ConfirmDialog } from '@/ui/ConfirmDialog'
import { ContextMenu } from '@/ui/ContextMenu'
import { Shortcuts } from '@/ui/Shortcuts'
import { Toolbar } from '@/ui/Toolbar'
import { useLast } from '@/ui/useLast'
// Panels are part of the page, never `lazy`: it would delay their first appearance by ~300 ms.
import NodePalette from '@/ui/NodePalette'
import CodePanel from '@/ui/CodePanel'
import HelpDialog from '@/ui/HelpDialog'
import ExamplesPanel from '@/ui/ExamplesPanel'
import NodeAbout from '@/ui/NodeAbout'

const NO_ERRORS: Record<string, string> = {}

function App() {
  const graph = useGraphStore((s) => s.graph)
  const codeOpen = useUIStore((s) => s.codeOpen)
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

  // The node previews wait for the code panel to be in place (or gone).
  useEffect(() => previewHub.hold(SLIDE_MS), [codeOpen])

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
        <NodePalette />
        <ExamplesPanel />
      </ReactFlowProvider>

      <Presence
        show={codeOpen}
        from="bottomOrLeft"
        // A phone keeps the bottom for the selection bar; a wide screen gives it as much height as its
        // code needs, down to that bar.
        className="absolute inset-x-3 bottom-20 flex h-[40%] flex-col sm:inset-x-auto sm:top-[4.25rem] sm:bottom-auto sm:left-4 sm:h-auto sm:max-h-[calc(100%-9rem)] sm:w-[26rem]"
      >
        <CodePanel ir={result.ok ? result.ir : null} />
      </Presence>
      <HelpDialog />
      <NodeAbout />
      <Preview code={glsl} onStatus={setStatus} error={globalError || (result.ok ? '' : 'The graph has an error, see the highlighted node.')} />

      {/* The result panel shows the error itself; hidden, the error still has to be seen. */}
      <Presence
        show={errorAlone}
        from="right"
        className="panel absolute top-3 right-3 max-w-[min(30rem,90%)] border-destructive p-3 sm:top-4 sm:right-4"
      >
        <pre className="text-xs whitespace-pre-wrap text-destructive">{shownError}</pre>
      </Presence>
      <Presence
        show={notice !== null}
        from="bottom"
        className="panel absolute bottom-20 left-1/2 -translate-x-1/2 px-3 py-2 text-sm"
      >
        {shownNotice}
      </Presence>
    </div>
  )
}

export default App
