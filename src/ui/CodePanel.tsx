import { useDeferredValue, useMemo, useState, type ReactNode } from 'react'
import { Check, Copy, X } from 'lucide-react'
import { generateCode, SHADER_LANGUAGES, type IRModule, type ShaderLanguage } from '@/core'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/uiStore'
import { PANEL_BUTTON, PANEL_HEADER } from './panel'
import { ShowErrorNodes } from './ShowErrorNodes'

const LANGUAGE_LABELS: Record<ShaderLanguage, string> = { glsl: 'GLSL', wgsl: 'WGSL', hlsl: 'HLSL' }

// 1 comment · 2 types · 3 keywords · 4 numbers
const TOKEN =
  /(\/\/.*$)|\b(float[234]?|vec[234]|f32)\b|(@\w+)|\b(void|uniform|out|in|precision|highp|mediump|lowp|return|fn|let|var|struct|cbuffer|register)\b|(\b\d+\.?\d*(?:e[+-]?\d+)?\b)/g
const CLASSES = ['', 'text-muted-foreground', 'text-port-vec2', 'text-port-vec4', 'text-port-vec4', 'text-port-vec3']

function highlight(line: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  for (const m of line.matchAll(TOKEN)) {
    if (m.index > last) out.push(line.slice(last, m.index))
    const group = [1, 2, 3, 4, 5].find((g) => m[g] !== undefined)!
    out.push(
      <span key={m.index} className={CLASSES[group]}>
        {m[0]}
      </span>,
    )
    last = m.index + m[0].length
  }
  out.push(line.slice(last))
  return out
}

/** Stands for code not written yet. */
const PENDING = 'pending' as const

export default function CodePanel({ ir, errorNodes }: { ir: IRModule | null; errorNodes: string[] }) {
  const [copied, setCopied] = useState(false)
  const language = useUIStore((s) => s.codeLanguage)
  // The panel opens at once, the code is written right after (and after each edit, without
  // holding up the graph).
  const shown = useDeferredValue<IRModule | null | typeof PENDING>(ir, PENDING)
  const code = useMemo(() => (shown === PENDING ? PENDING : shown ? generateCode(shown, language) : null), [shown, language])

  const copy = async () => {
    if (code === PENDING || code === null) return
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // Not available outside https / localhost, or refused by the browser.
      useUIStore.getState().setNotice('The browser blocked clipboard access')
      return
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="panel flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className={PANEL_HEADER}>
        <div className="flex flex-1 gap-0.5" role="tablist" aria-label="Shading language">
          {SHADER_LANGUAGES.map((l) => (
            <button
              key={l}
              role="tab"
              aria-selected={l === language}
              onClick={() => useUIStore.getState().setCodeLanguage(l)}
              className={cn(
                'h-10 rounded-lg px-2.5 text-sm sm:h-8',
                l === language ? 'bg-accent font-medium' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {LANGUAGE_LABELS[l]}
            </button>
          ))}
        </div>
        <button type="button" className={PANEL_BUTTON} aria-label="Copy code" title="Copy code" onClick={copy} disabled={code === PENDING || code === null}>
          {copied ? <Check /> : <Copy />}
        </button>
        <button type="button" className={PANEL_BUTTON} aria-label="Close" title="Close (C)" onClick={() => useUIStore.getState().toggleCode()}>
          <X />
        </button>
      </div>
      <pre className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap">
        {code === PENDING ? (
          <span className="text-muted-foreground">Generating code…</span>
        ) : code === null ? (
          <span className="flex flex-col items-start gap-2 font-sans">
            <span className="text-muted-foreground">The graph has an error: there is no code to show.</span>
            <ShowErrorNodes ids={errorNodes} />
          </span>
        ) : (
          code.split('\n').map((text, i) => (
            // Indentation is padding, so a wrapped long line stays aligned under its start.
            <div key={i} style={{ paddingLeft: `${text.length - text.trimStart().length}ch` }}>
              {highlight(text.trimStart())}
              {text === '' && ' '}
            </div>
          ))
        )}
      </pre>
    </div>
  )
}
