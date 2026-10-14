import { useMemo } from 'react'
import { useStore } from 'zustand'
import {
  BookOpen,
  BoxSelect,
  CircleHelp,
  ClipboardPaste,
  CodeXml,
  Copy,
  CopyPlus,
  Download,
  Eye,
  EyeOff,
  FilePlus,
  FoldVertical,
  GitCommitHorizontal,
  Info,
  Monitor,
  Plus,
  Redo2,
  RotateCcw,
  Scan,
  Scissors,
  Trash2,
  Undo2,
  UnfoldVertical,
  Upload,
  X,
  type LucideIcon,
} from 'lucide-react'
import {
  chooseProjectFile,
  copyToClipboard,
  cutToClipboard,
  deleteSelection,
  describeSelection,
  duplicateSelection,
  newProject,
  pasteFromClipboard,
  resetSelectionValues,
  saveProjectFile,
  selectAll,
  toggleSelectionFold,
  toggleSelectionPreviews,
} from '@/store/fileActions'
import { redo, undo, useGraphStore } from '@/store/graphStore'
import { useUIStore } from '@/store/uiStore'
import { useFit } from './view'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
/** The modifier key, as this keyboard spells it. */
export const MOD = isMac ? '⌘' : 'Ctrl'

/** What the actions depend on to be offered, enabled or named. */
export interface ActionState {
  selection: ReturnType<typeof describeSelection>
  canUndo: boolean
  canRedo: boolean
  resultOpen: boolean
  codeOpen: boolean
}

/** What running an action may need from where it was triggered. */
export interface ActionEnv {
  fit: (everything?: boolean) => void
  /** Flow position for something added "here" (a menu at the pointer, a key under the mouse). */
  at?: { x: number; y: number }
}

type Of<T> = T | ((s: ActionState) => T)

export interface Action {
  label: Of<string>
  icon: Of<LucideIcon>
  /** Keys that trigger it, alternatives first to last; the first one is shown in menus and tooltips. */
  keys?: string[][]
  /** Not offered at all when false. */
  available?: (s: ActionState) => boolean
  /** Offered, but greyed out, when false. */
  enabled?: (s: ActionState) => boolean
  /** A switch: shows a check when on. */
  checked?: (s: ActionState) => boolean
  destructive?: boolean
  run: (env: ActionEnv) => void
}

const ui = () => useUIStore.getState()
const plural = (n: number, word: string) => (n > 1 ? `${word}s` : word)

/**
 * Everything the user can do from a bar, a menu or a key, described once: the selection bar, the
 * menus, the keyboard shortcuts and the help all read their names, icons and keys here.
 */
export const ACTIONS = {
  add: {
    label: 'Add a node',
    icon: Plus,
    keys: [['Tab'], ['Shift', 'A']],
    run: ({ at }) => ui().openPalette(at),
  },
  insert: {
    label: 'Insert a node',
    icon: GitCommitHorizontal,
    available: (s) => s.selection.wires.length === 1 && s.selection.count === 1,
    run: ({ at }) => {
      const { wires } = currentSelection()
      if (wires.length === 1) ui().openPaletteOnWire(wires[0], at)
    },
  },
  paste: { label: 'Paste', icon: ClipboardPaste, keys: [[MOD, 'V']], run: () => void pasteFromClipboard() },
  selectAll: { label: 'Select all', icon: BoxSelect, keys: [[MOD, 'A']], run: selectAll },
  frame: {
    label: (s) => (s.selection.count > 0 ? 'Frame the selection' : 'Frame everything'),
    icon: Scan,
    keys: [['F']],
    run: ({ fit }) => fit(),
  },
  previews: {
    label: ({ selection: s }) => `${s.showPreviews ? 'Show' : 'Hide'} ${plural(s.previewable.length, 'preview')}`,
    icon: (s: ActionState) => (s.selection.showPreviews ? Eye : EyeOff),
    keys: [['P']],
    available: (s) => s.selection.previewable.length > 0,
    run: toggleSelectionPreviews,
  },
  fold: {
    label: (s) => (s.selection.fold ? 'Fold' : 'Unfold'),
    icon: (s: ActionState) => (s.selection.fold ? FoldVertical : UnfoldVertical),
    keys: [['H']],
    available: (s) => s.selection.nodes.length > 0,
    run: toggleSelectionFold,
  },
  about: {
    label: 'About this node',
    icon: Info,
    keys: [['I']],
    available: (s) => s.selection.nodes.length === 1,
    run: () => {
      const { nodes } = currentSelection()
      if (nodes.length === 1) ui().setAbout(nodes[0].type)
    },
  },
  reset: {
    label: (s) => plural(s.selection.withValues.length, 'Reset value'),
    icon: RotateCcw,
    available: (s) => s.selection.withValues.length > 0,
    run: resetSelectionValues,
  },
  duplicate: { label: 'Duplicate', icon: CopyPlus, keys: [[MOD, 'D']], available: (s) => s.selection.copyable, run: duplicateSelection },
  copy: { label: 'Copy', icon: Copy, keys: [[MOD, 'C']], available: (s) => s.selection.copyable, run: () => void copyToClipboard() },
  cut: {
    label: 'Cut',
    icon: Scissors,
    keys: [[MOD, 'X']],
    available: (s) => s.selection.copyable,
    enabled: (s) => s.selection.removable,
    run: () => void cutToClipboard(),
  },
  delete: {
    label: 'Delete',
    icon: Trash2,
    keys: [['Del']],
    enabled: (s) => s.selection.removable,
    destructive: true,
    run: deleteSelection,
  },
  deselect: { label: 'Deselect', icon: X, keys: [['Esc']], run: () => ui().setSelection([]) },

  undo: { label: 'Undo', icon: Undo2, keys: [[MOD, 'Z']], enabled: (s) => s.canUndo, run: undo },
  redo: { label: 'Redo', icon: Redo2, keys: [[MOD, 'Shift', 'Z'], [MOD, 'Y']], enabled: (s) => s.canRedo, run: redo },

  result: { label: 'Result preview', icon: Monitor, keys: [['R']], checked: (s) => s.resultOpen, run: () => ui().toggleResult() },
  code: { label: 'Generated code', icon: CodeXml, keys: [['C']], checked: (s) => s.codeOpen, run: () => ui().toggleCode() },
  help: { label: 'Help and shortcuts', icon: CircleHelp, keys: [['?']], run: () => ui().setHelpOpen(true) },

  newProject: { label: 'New project', icon: FilePlus, run: newProject },
  examples: { label: 'Examples…', icon: BookOpen, run: () => ui().setExamplesOpen(true) },
  open: { label: 'Open file…', icon: Upload, keys: [[MOD, 'O']], run: chooseProjectFile },
  save: { label: 'Save to file', icon: Download, keys: [[MOD, 'S']], run: saveProjectFile },
} satisfies Record<string, Action>

export type ActionId = keyof typeof ACTIONS

/** An action in a menu, or `-` for a separator. */
export type MenuEntry = ActionId | '-'

export const MENUS = {
  /**
   * The ≡ menu. Paste and Select all are there for touch screens, which have neither keys nor right
   * click. The code has its own button in the bar.
   */
  project: ['newProject', 'examples', '-', 'open', 'save', '-', 'paste', 'selectAll', 'frame', '-', 'result', '-', 'help'],
  /** Right-click on a wire. */
  wire: ['insert', '-', 'delete'],
  /** Right-click on empty canvas. */
  pane: ['add', 'paste', '-', 'selectAll', 'frame'],
  /** What can be done with the selected nodes: the node menu, and the "more" of the selection bar. */
  selection: ['insert', 'frame', 'previews', 'fold', 'about', 'reset', '-', 'duplicate', 'copy', 'cut', '-', 'delete'],
} satisfies Record<string, MenuEntry[]>

const currentSelection = () => describeSelection(useGraphStore.getState().graph, useUIStore.getState().selected)

/** The state the actions read, kept up to date. */
export function useActionState(): ActionState {
  const graph = useGraphStore((s) => s.graph)
  const selected = useUIStore((s) => s.selected)
  const canUndo = useStore(useGraphStore.temporal, (s) => s.pastStates.length > 0)
  const canRedo = useStore(useGraphStore.temporal, (s) => s.futureStates.length > 0)
  const resultOpen = useUIStore((s) => s.resultOpen)
  const codeOpen = useUIStore((s) => s.codeOpen)
  // Selected ids can outlive their nodes (after an undo): only what still exists counts.
  const selection = useMemo(() => describeSelection(graph, selected), [graph, selected])
  return { selection, canUndo, canRedo, resultOpen, codeOpen }
}

export function useActionEnv(): ActionEnv {
  return { fit: useFit() }
}

const resolve = <T>(value: Of<T>, s: ActionState): T => (typeof value === 'function' ? (value as (s: ActionState) => T)(s) : value)

/** An action as it stands right now, ready to be drawn. */
export function describe(id: ActionId, s: ActionState) {
  const action: Action = ACTIONS[id]
  return {
    label: resolve(action.label, s),
    icon: resolve(action.icon, s),
    /** The first keys, as shown in a menu or a tooltip ("Ctrl+D"). */
    shortcut: action.keys?.[0].join('+'),
    available: action.available?.(s) ?? true,
    enabled: action.enabled?.(s) ?? true,
    checked: action.checked?.(s),
    destructive: action.destructive === true,
  }
}

/** Run an action from a key: only when it is offered and enabled right now. */
export function runAction(id: ActionId, env: ActionEnv) {
  const action: Action = ACTIONS[id]
  const s: ActionState = {
    selection: currentSelection(),
    canUndo: useGraphStore.temporal.getState().pastStates.length > 0,
    canRedo: useGraphStore.temporal.getState().futureStates.length > 0,
    resultOpen: ui().resultOpen,
    codeOpen: ui().codeOpen,
  }
  if ((action.available?.(s) ?? true) && (action.enabled?.(s) ?? true)) action.run(env)
}

/** For the help: the keys of an action. */
export const keysOf = (id: ActionId) => (ACTIONS[id] as Action).keys ?? []
