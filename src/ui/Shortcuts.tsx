import { useEffect } from 'react'
import { useReactFlow } from '@xyflow/react'
import {
  copySelection,
  copyToClipboard,
  cutSelection,
  cutToClipboard,
  duplicateSelection,
  pasteCopied,
  pasteText,
  saveProjectFile,
  chooseProjectFile,
  selectAll,
  toggleSelectionFold,
  toggleSelectionPreviews,
} from '@/store/fileActions'
import { redo, undo } from '@/store/graphStore'
import { useUIStore } from '@/store/uiStore'
import { pointerOnCanvas } from './pointer'
import { useFit } from './view'

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
}

/**
 * Tab adds a node, as in most node editors, but only from the page or the canvas itself:
 * from a button or a field it still moves the focus, so the interface stays usable by keyboard.
 */
function onCanvas(target: EventTarget | null) {
  if (target === document.body) return true
  // A clicked node or wire holds the focus; its buttons and fields keep Tab.
  return target instanceof HTMLElement && target.closest('.react-flow') !== null && !target.closest('button, input, select, textarea, [tabindex="-1"]')
}

/** Number fields have no text history worth keeping: Ctrl+Z there undoes the graph. */
const isNumberField = (target: EventTarget | null) => target instanceof HTMLElement && 'numberField' in target.dataset

/** A dialog or a menu is open: keys belong to it, not to the graph. */
const inOverlay = (target: EventTarget | null) =>
  target instanceof HTMLElement && target.closest('[role=dialog], [role=menu]') !== null

/** The user has selected text meant to be read and copied (generated code, help): leave that copy alone. */
function copyingText() {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed) return false
  const node = selection.anchorNode
  const element = node instanceof Element ? node : node?.parentElement
  return !!element?.closest('pre, [role=dialog]')
}

/** How long a paste event may take to follow Ctrl+V before the in-app copy is pasted instead. */
const PASTE_EVENT_MS = 150

/** Keyboard shortcuts of the editor. Renders nothing. */
export function Shortcuts() {
  const fit = useFit()
  const { zoomIn, zoomOut, screenToFlowPosition } = useReactFlow()

  useEffect(() => {
    // A key adds the node under the mouse, if it is over the canvas (else in the middle of the view).
    const addHere = () => {
      const at = pointerOnCanvas()
      useUIStore.getState().openPalette(at ? screenToFlowPosition(at) : undefined)
    }
    let pasteFallback: ReturnType<typeof setTimeout> | undefined

    const onKeyDown = (e: KeyboardEvent) => {
      const ui = useUIStore.getState()
      const typing = isTyping(e.target)
      const mod = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()

      if (e.key === 'Escape') {
        if (ui.previewFullscreen) ui.setPreviewFullscreen(false)
        // Leave the field being edited first, then drop the selection.
        else if (typing && !inOverlay(e.target)) (e.target as HTMLElement).blur()
        else if (!inOverlay(e.target)) ui.setSelection([])
        return
      }
      if (inOverlay(e.target)) return

      if (e.key === 'Tab' && !mod && !e.altKey && !e.shiftKey && onCanvas(e.target)) {
        e.preventDefault()
        addHere()
        return
      }

      if (!mod && !e.altKey && !typing) {
        if (key === 'a' && e.shiftKey) {
          e.preventDefault()
          addHere()
        } else if (key === 'v') ui.setTool(ui.tool === 'select' ? 'pan' : 'select')
        else if (key === 'f') fit()
        else if (key === 'r') ui.toggleResult()
        else if (key === 'c') ui.toggleCode()
        else if (key === 'p') toggleSelectionPreviews()
        else if (key === 'h') toggleSelectionFold()
        else if (e.key === '+' || e.key === '=') void zoomIn({ duration: 150 })
        else if (e.key === '-') void zoomOut({ duration: 150 })
        else if (e.key === '?') ui.setHelpOpen(true)
        return
      }
      if (!mod) return

      // Leaving the field drops its typed draft, so it shows the restored value after an undo.
      if (isNumberField(e.target) && (key === 'z' || key === 'y')) (e.target as HTMLElement).blur()
      if (key === 'k') {
        e.preventDefault()
        addHere()
      } else if (key === 's') {
        e.preventDefault() // the browser would save the page
        saveProjectFile()
      } else if (key === 'o') {
        e.preventDefault() // the browser would open a file itself
        chooseProjectFile(() => setTimeout(() => fit(true), 120))
      } else if (typing && !isNumberField(e.target)) {
        return // text fields keep their own select all, clipboard and undo
      } else if (key === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (key === 'y') {
        e.preventDefault()
        redo()
      } else if (typing) {
        return // a number field keeps its own select all and clipboard
      } else if (key === 'a') {
        e.preventDefault()
        selectAll()
      } else if (key === 'd') {
        e.preventDefault() // the browser would bookmark the page
        duplicateSelection()
      } else if (key === 'c' && !e.shiftKey) {
        // Done here rather than in the `copy` event: browsers do not all send it when no text is selected.
        if (copyingText()) return
        e.preventDefault()
        void copyToClipboard()
      } else if (key === 'x') {
        e.preventDefault()
        void cutToClipboard()
      } else if (key === 'v' && !e.shiftKey) {
        // The `paste` event brings the system clipboard without asking for permission.
        // If it never comes, paste what was copied in this tab.
        clearTimeout(pasteFallback)
        pasteFallback = setTimeout(pasteCopied, PASTE_EVENT_MS)
      }
    }

    // Copy and cut from the browser's own menu; paste from anywhere.
    const onCopy = (e: ClipboardEvent) => {
      if (isTyping(e.target) || copyingText()) return
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
      if (isTyping(e.target) || inOverlay(e.target)) return
      clearTimeout(pasteFallback)
      const text = e.clipboardData?.getData('text/plain')
      // Something else on the clipboard (or nothing readable): what was copied here still pastes.
      if ((text && pasteText(text)) || pasteCopied()) e.preventDefault()
    }

    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('copy', onCopy)
    document.addEventListener('cut', onCut)
    document.addEventListener('paste', onPaste)
    return () => {
      clearTimeout(pasteFallback)
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('copy', onCopy)
      document.removeEventListener('cut', onCut)
      document.removeEventListener('paste', onPaste)
    }
  }, [fit, zoomIn, zoomOut, screenToFlowPosition])

  return null
}
