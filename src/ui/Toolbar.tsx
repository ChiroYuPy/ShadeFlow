import { useMemo, useRef, type ComponentProps } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useStore } from 'zustand'
import {
  BookOpen,
  CircleHelp,
  Code,
  Copy,
  CopyPlus,
  Download,
  Eye,
  EyeOff,
  FilePlus,
  FoldVertical,
  Hand,
  Menu,
  Minus,
  Monitor,
  MousePointer2,
  Plus,
  Redo2,
  Scan,
  Trash2,
  Undo2,
  UnfoldVertical,
  Upload,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  confirmReplace,
  copyToClipboard,
  deleteSelection,
  describeSelection,
  duplicateSelection,
  newProject,
  openProjectFile,
  saveProjectFile,
  toggleSelectionFold,
  toggleSelectionPreviews,
} from '@/store/fileActions'
import { redo, undo, useGraphStore } from '@/store/graphStore'
import { useUIStore } from '@/store/uiStore'
import { Presence } from './Presence'
import { useLast } from './useLast'
import { FIT_VIEW } from './view'

const BAR = 'panel absolute flex items-center gap-1 p-1'

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

const Shortcut = ({ children }: { children: string }) => <span className="ml-auto pl-4 text-xs text-muted-foreground">{children}</span>


/** Top left: the project (new, examples, files, help) and the history. */
function ProjectBar() {
  const { fitView } = useReactFlow()
  const canUndo = useStore(useGraphStore.temporal, (s) => s.pastStates.length > 0)
  const canRedo = useStore(useGraphStore.temporal, (s) => s.futureStates.length > 0)
  const fileInput = useRef<HTMLInputElement>(null)

  // A new project replaces the whole graph: bring it into view once it is measured.
  const fitSoon = () => setTimeout(() => void fitView(FIT_VIEW), 120)

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
          <DropdownMenuItem onSelect={() => useUIStore.getState().setExamplesOpen(true)}>
            <BookOpen /> Examples…
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => confirmReplace('Open a project file?', () => fileInput.current?.click())}>
            <Upload /> Open file…
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={saveProjectFile}>
            <Download /> Save to file
            <Shortcut>Ctrl+S</Shortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => useUIStore.getState().setHelpOpen(true)}>
            <CircleHelp /> Help and shortcuts
            <Shortcut>?</Shortcut>
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

/** Bottom right: zoom in, zoom out, fit the graph. A touch screen pinches to zoom: only "fit" is left there. */
function ZoomBar() {
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  return (
    <div className={cn(BAR, 'right-3 bottom-4 flex-col sm:right-4')}>
      <Tool label="Zoom in" className="pointer-coarse:hidden" onClick={() => void zoomIn({ duration: 150 })}>
        <Plus />
      </Tool>
      <Tool label="Zoom out" className="pointer-coarse:hidden" onClick={() => void zoomOut({ duration: 150 })}>
        <Minus />
      </Tool>
      <Tool label="Fit graph in view" shortcut="F" onClick={() => void fitView(FIT_VIEW)}>
        <Scan />
      </Tool>
    </div>
  )
}

/** Bottom center: add a node, the tool in hand, and the panels to show (result, code). It never changes size. */
function MainBar() {
  const tool = useUIStore((s) => s.tool)
  const codeOpen = useUIStore((s) => s.codeOpen)
  const resultOpen = useUIStore((s) => s.resultOpen)

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
      <Divider />
      <Tool label="Result preview" active={resultOpen} onClick={() => useUIStore.getState().toggleResult()}>
        <Monitor />
      </Tool>
      <Tool label="Generated code" active={codeOpen} onClick={() => useUIStore.getState().toggleCode()}>
        <Code />
      </Tool>
    </div>
  )
}

/**
 * Just above the main bar, while something is selected: what can be done with it. Everything here
 * is also in the right-click menu, but a touch screen has no right click and no keyboard.
 */
function SelectionBar() {
  const selected = useUIStore((s) => s.selected)
  const graph = useGraphStore((s) => s.graph)
  // Selected ids can outlive their nodes (after an undo): only what still exists counts.
  const current = useMemo(() => describeSelection(graph, selected), [graph, selected])
  const show = current.count > 0
  // While the bar leaves, it keeps showing the selection it was about.
  const selection = useLast(current, show)

  return (
    <Presence show={show} from="bottom" className={cn(BAR, 'bottom-[4.5rem] left-1/2 -translate-x-1/2')} role="toolbar" aria-label="Selection">
      <span className="px-2 text-sm whitespace-nowrap text-muted-foreground tabular-nums">{selection.count} selected</span>
      <Divider />
      {selection.previewable.length > 0 && (
        <Tool label={selection.showPreviews ? 'Show preview' : 'Hide preview'} onClick={toggleSelectionPreviews}>
          {selection.showPreviews ? <Eye /> : <EyeOff />}
        </Tool>
      )}
      {selection.nodes.length > 0 && (
        <Tool label={selection.fold ? 'Fold' : 'Unfold'} onClick={toggleSelectionFold}>
          {selection.fold ? <FoldVertical /> : <UnfoldVertical />}
        </Tool>
      )}
      {selection.copyable && (
        <>
          <Tool label="Duplicate selection" shortcut="Ctrl+D" onClick={duplicateSelection}>
            <CopyPlus />
          </Tool>
          <Tool label="Copy selection" shortcut="Ctrl+C" onClick={() => void copyToClipboard()}>
            <Copy />
          </Tool>
        </>
      )}
      <Tool label="Delete selection" shortcut="Del" disabled={!selection.removable} onClick={deleteSelection}>
        <Trash2 />
      </Tool>
      <Divider />
      <Tool label="Deselect" shortcut="Esc" onClick={() => useUIStore.getState().setSelection([])}>
        <X />
      </Tool>
    </Presence>
  )
}

export function Toolbar() {
  return (
    <>
      <ProjectBar />
      <SelectionBar />
      <MainBar />
      <ZoomBar />
    </>
  )
}
