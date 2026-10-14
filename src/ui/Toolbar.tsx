import { useMemo, useRef, type ComponentProps } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useStore } from 'zustand'
import {
  BookOpen,
  Check,
  CircleHelp,
  Code,
  Copy,
  CopyPlus,
  Download,
  Eye,
  EyeOff,
  FilePlus,
  FoldVertical,
  Menu,
  Monitor,
  Plus,
  Redo2,
  Scan,
  SquareDashedMousePointer,
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
import { FIT_VIEW, useFit } from './view'

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

const Divider = ({ className }: { className?: string }) => <span className={cn('mx-1 h-5 w-px bg-border', className)} />

const Shortcut = ({ children }: { children: string }) => <span className="ml-auto pl-4 text-xs text-muted-foreground">{children}</span>


/** Top left: the project (new, examples, files, panels, help), the history, and adding a node. */
function ProjectBar() {
  const { fitView } = useReactFlow()
  const canUndo = useStore(useGraphStore.temporal, (s) => s.pastStates.length > 0)
  const canRedo = useStore(useGraphStore.temporal, (s) => s.futureStates.length > 0)
  const fileInput = useRef<HTMLInputElement>(null)
  const codeOpen = useUIStore((s) => s.codeOpen)
  const resultOpen = useUIStore((s) => s.resultOpen)

  // A new project replaces the whole graph: bring it into view once it is measured.
  const fitSoon = () => setTimeout(() => void fitView(FIT_VIEW), 120)
  const fitAll = () => void fitView(FIT_VIEW)

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
          <DropdownMenuItem onSelect={fitAll}>
            <Scan /> Fit everything
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => useUIStore.getState().toggleResult()}>
            <Monitor /> Result preview
            {resultOpen && <Check />}
            <Shortcut>R</Shortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => useUIStore.getState().toggleCode()}>
            <Code /> Generated code
            {codeOpen && <Check />}
            <Shortcut>C</Shortcut>
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
      <Divider />
      <Tool label="Add a node" shortcut="Tab or Ctrl+K" onClick={() => useUIStore.getState().openPalette()}>
        <Plus />
      </Tool>
    </div>
  )
}

/**
 * Bottom center, only while something is selected: what can be done with it. Everything here is
 * also in the right-click menu, but a touch screen has no right click and no keyboard.
 */
function SelectionBar() {
  const selected = useUIStore((s) => s.selected)
  const graph = useGraphStore((s) => s.graph)
  // Selected ids can outlive their nodes (after an undo): only what still exists counts.
  const current = useMemo(() => describeSelection(graph, selected), [graph, selected])
  const show = current.count > 0
  // While the bar leaves, it keeps showing the selection it was about.
  const selection = useLast(current, show)
  const fit = useFit()
  const areaTool = useUIStore((s) => s.tool) === 'select'

  return (
    <Presence show={show} from="bottom" className={cn(BAR, 'bottom-4 left-1/2 -translate-x-1/2')} role="toolbar" aria-label="Selection">
      {/* A phone has just the room for the buttons. */}
      <span className="px-2 text-sm whitespace-nowrap text-muted-foreground tabular-nums max-sm:hidden">{selection.count} selected</span>
      <Divider className="max-sm:hidden" />
      {/* A finger has no Shift to draw a rectangle: this arms it for one drag. */}
      <Tool
        label="Select an area: drag a rectangle"
        className="hidden pointer-coarse:inline-flex"
        active={areaTool}
        onClick={() => useUIStore.getState().setTool(areaTool ? 'pan' : 'select')}
      >
        <SquareDashedMousePointer />
      </Tool>
      <Tool label="Frame the selection" shortcut="F" onClick={() => fit()}>
        <Scan />
      </Tool>
      {selection.previewable.length > 0 && (
        <Tool label={selection.showPreviews ? 'Show preview' : 'Hide preview'} shortcut="P" onClick={toggleSelectionPreviews}>
          {selection.showPreviews ? <Eye /> : <EyeOff />}
        </Tool>
      )}
      {selection.nodes.length > 0 && (
        <Tool label={selection.fold ? 'Fold' : 'Unfold'} shortcut="H" onClick={toggleSelectionFold}>
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
    </>
  )
}
