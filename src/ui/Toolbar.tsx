import { useMemo, useRef, type ComponentProps } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useStore } from 'zustand'
import { BookOpen, CircleHelp, Code, CopyPlus, Download, Eye, FilePlus, Hand, Menu, Minus, MousePointer2, Plus, Redo2, Scan, Trash2, Undo2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { EXAMPLES } from '@/demo/examples'
import { confirmReplace, deleteSelection, duplicateSelection, loadGraph, newProject, openProjectFile, saveProjectFile } from '@/store/fileActions'
import { redo, undo, useGraphStore } from '@/store/graphStore'
import { useUIStore } from '@/store/uiStore'

const BAR = 'absolute flex items-center gap-1 rounded-xl border bg-card/90 p-1 shadow-lg backdrop-blur'

/** An icon button; `shortcut` is shown in its tooltip. */
function Tool({ label, shortcut, active, ...props }: ComponentProps<typeof Button> & { label: string; shortcut?: string; active?: boolean }) {
  const title = shortcut ? `${label} (${shortcut})` : label
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={title}
      title={title}
      aria-pressed={active}
      {...props}
      className={cn(active && 'bg-selection/15 text-selection', props.className)}
    />
  )
}

const Divider = () => <span className="mx-1 h-5 w-px bg-border" />

/** Top left: the project (new, examples, files) and the history. */
function ProjectBar() {
  const { fitView } = useReactFlow()
  const canUndo = useStore(useGraphStore.temporal, (s) => s.pastStates.length > 0)
  const canRedo = useStore(useGraphStore.temporal, (s) => s.futureStates.length > 0)
  const fileInput = useRef<HTMLInputElement>(null)

  // A new project replaces the whole graph: bring it into view once it is measured.
  const fitSoon = () => setTimeout(() => fitView({ padding: 0.3, minZoom: 0.5, duration: 300 }), 120)

  return (
    <div className={cn(BAR, 'top-3 left-3 sm:top-4 sm:left-4')}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Project menu" title="Project">
            <Menu />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="bottom" className="min-w-48">
          <DropdownMenuItem
            onSelect={() =>
              confirmReplace('Start a new project?', () => {
                newProject()
                fitSoon()
              })
            }
          >
            <FilePlus /> New project
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <BookOpen /> Examples
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {EXAMPLES.map((example) => (
                <DropdownMenuItem
                  key={example.id}
                  onSelect={() =>
                    confirmReplace(`Open the “${example.name}” example?`, () => {
                      loadGraph(example.graph)
                      fitSoon()
                    })
                  }
                >
                  <span className="flex flex-col">
                    <span>{example.name}</span>
                    <span className="text-xs text-muted-foreground">{example.description}</span>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => confirmReplace('Open a project file?', () => fileInput.current?.click())}>
            <Upload /> Open file…
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={saveProjectFile}>
            <Download /> Save to file
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <input
        ref={fileInput}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void openProjectFile(file).then(fitSoon)
          e.target.value = ''
        }}
      />
      <Divider />
      <Tool label="Undo" shortcut="Ctrl+Z" disabled={!canUndo} onClick={undo}>
        <Undo2 />
      </Tool>
      <Tool label="Redo" shortcut="Ctrl+Shift+Z" disabled={!canRedo} onClick={redo}>
        <Redo2 />
      </Tool>
    </div>
  )
}

/** Zoom column (same on every device): zoom in, zoom out, fit the graph. */
function ZoomBar() {
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  return (
    <div className={cn(BAR, 'right-3 bottom-20 flex-col sm:right-4 sm:bottom-4')}>
      <Tool label="Zoom in" onClick={() => void zoomIn({ duration: 150 })}>
        <Plus />
      </Tool>
      <Tool label="Zoom out" onClick={() => void zoomOut({ duration: 150 })}>
        <Minus />
      </Tool>
      <Tool label="Fit graph in view" onClick={() => void fitView({ padding: 0.3, minZoom: 0.5, duration: 300 })}>
        <Scan />
      </Tool>
    </div>
  )
}

/** Bottom center: tools and what is shown. Duplicate / delete appear once something is selected. */
function MainBar() {
  const tool = useUIStore((s) => s.tool)
  const codeOpen = useUIStore((s) => s.codeOpen)
  const nodePreviews = useUIStore((s) => s.nodePreviews)
  // Selected ids can outlive their nodes (after an undo): only count what still exists.
  const selected = useUIStore((s) => s.selected)
  const graph = useGraphStore((s) => s.graph)
  const hasSelection = useMemo(
    () => [...selected].some((id) => id in graph.nodes || graph.edges.some((e) => e.id === id)),
    [selected, graph],
  )

  return (
    <div className={cn(BAR, 'bottom-4 left-1/2 -translate-x-1/2')}>
      <Tool label="Add a node" shortcut="Ctrl+K" onClick={() => useUIStore.getState().openPalette()}>
        <Plus />
      </Tool>
      <Divider />
      <Tool label="Move the view: drag the background" shortcut="H" active={tool === 'pan'} onClick={() => useUIStore.getState().setTool('pan')}>
        <Hand />
      </Tool>
      <Tool label="Select: drag a rectangle" shortcut="V" active={tool === 'select'} onClick={() => useUIStore.getState().setTool('select')}>
        <MousePointer2 />
      </Tool>
      {hasSelection && (
        <>
          <Tool label="Duplicate selection" shortcut="Ctrl+D" onClick={duplicateSelection}>
            <CopyPlus />
          </Tool>
          <Tool label="Delete selection" shortcut="Del" onClick={deleteSelection}>
            <Trash2 />
          </Tool>
        </>
      )}
      <Divider />
      <Tool label="Node previews" active={nodePreviews} onClick={() => useUIStore.getState().toggleNodePreviews()}>
        <Eye />
      </Tool>
      <Tool label="Generated code" active={codeOpen} onClick={() => useUIStore.getState().toggleCode()}>
        <Code />
      </Tool>
      <Tool label="Help and shortcuts" shortcut="?" onClick={() => useUIStore.getState().setHelpOpen(true)}>
        <CircleHelp />
      </Tool>
    </div>
  )
}

export function Toolbar() {
  return (
    <>
      <ProjectBar />
      <MainBar />
      <ZoomBar />
    </>
  )
}
