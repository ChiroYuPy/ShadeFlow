import { create } from 'zustand'
import type { ShaderLanguage, WireAnchor } from '@/core'

interface Size {
  width: number
  height: number
}

interface Position {
  x: number
  y: number
}

/** Editor state that is not part of the project and not undoable. */
interface UIState {
  /** Ids of selected nodes and edges. */
  selected: ReadonlySet<string>
  /** Node sizes measured by React Flow. */
  sizes: Record<string, Size>
  applyChanges: (changes: { select: [string, boolean][]; sizes: [string, Size][] }) => void
  setSelection: (ids: string[]) => void

  /**
   * Node palette. `at` is the flow position for the new node (viewport center when null).
   * `anchor` is set when it was opened by dropping a wire: only compatible nodes are
   * listed and the new node gets connected.
   */
  palette: { open: boolean; at: Position | null; anchor: WireAnchor | null }
  openPalette: (at?: Position, anchor?: WireAnchor) => void
  closePalette: () => void

  /** Right-click menu: where it opened (screen and flow coordinates) and what was clicked. */
  contextMenu: { x: number; y: number; at: Position; target: 'node' | 'edge' | 'pane'; id?: string } | null
  openContextMenu: (menu: NonNullable<UIState['contextMenu']>) => void
  closeContextMenu: () => void

  /** What dragging the empty canvas does: move the view, or (armed for one drag, on touch) draw a selection rectangle. */
  tool: 'pan' | 'select'
  setTool: (tool: 'pan' | 'select') => void

  /** Bumped to ask the canvas to frame the whole graph once it is measured (after a project is replaced). */
  fitRequest: number
  requestFit: () => void

  /** Show the result of the shader, in the corner. */
  resultOpen: boolean
  toggleResult: () => void
  /** The result panel has two sizes. */
  resultLarge: boolean
  toggleResultLarge: () => void

  codeOpen: boolean
  toggleCode: () => void
  /** Language shown in the code panel. */
  codeLanguage: ShaderLanguage
  setCodeLanguage: (language: ShaderLanguage) => void

  previewFullscreen: boolean
  setPreviewFullscreen: (open: boolean) => void

  helpOpen: boolean
  setHelpOpen: (open: boolean) => void

  /** The node type whose description is shown ("About this node"), if any. */
  about: string | null
  setAbout: (type: string | null) => void

  /** The overlay to pick an example from. */
  examplesOpen: boolean
  setExamplesOpen: (open: boolean) => void

  /** A short message shown to the user (import errors, a replaced project…), with maybe one action. */
  notice: Notice | null
  setNotice: (message: string | null, action?: Notice['action']) => void
}

export interface Notice {
  message: string
  action?: { label: string; run: () => void }
}

export const useUIStore = create<UIState>()((set) => ({
  selected: new Set(),
  sizes: {},
  applyChanges: ({ select, sizes }) =>
    set((state) => {
      const next: Partial<UIState> = {}
      if (select.length) {
        const selected = new Set(state.selected)
        for (const [id, on] of select) {
          if (on) selected.add(id)
          else selected.delete(id)
        }
        next.selected = selected
      }
      if (sizes.length) next.sizes = { ...state.sizes, ...Object.fromEntries(sizes) }
      return next
    }),
  setSelection: (ids) => set({ selected: new Set(ids) }),

  palette: { open: false, at: null, anchor: null },
  openPalette: (at, anchor) => set({ palette: { open: true, at: at ?? null, anchor: anchor ?? null } }),
  closePalette: () => set((s) => ({ palette: { ...s.palette, open: false } })),

  contextMenu: null,
  openContextMenu: (contextMenu) => set({ contextMenu }),
  closeContextMenu: () => set({ contextMenu: null }),

  tool: 'pan',
  setTool: (tool) => set({ tool }),

  fitRequest: 0,
  requestFit: () => set((s) => ({ fitRequest: s.fitRequest + 1 })),

  resultOpen: true,
  toggleResult: () => set((s) => ({ resultOpen: !s.resultOpen })),
  resultLarge: false,
  toggleResultLarge: () => set((s) => ({ resultLarge: !s.resultLarge })),

  codeOpen: false,
  toggleCode: () => set((s) => ({ codeOpen: !s.codeOpen })),
  codeLanguage: 'glsl',
  setCodeLanguage: (language) => set({ codeLanguage: language }),

  previewFullscreen: false,
  setPreviewFullscreen: (open) => set({ previewFullscreen: open }),

  helpOpen: false,
  setHelpOpen: (open) => set({ helpOpen: open }),

  about: null,
  setAbout: (type) => set({ about: type }),

  examplesOpen: false,
  setExamplesOpen: (open) => set({ examplesOpen: open }),

  notice: null,
  setNotice: (message, action) => set({ notice: message === null ? null : { message, action } }),
}))
