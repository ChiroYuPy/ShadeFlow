import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Check, Copy, X } from 'lucide-react'
import { generateCodeLines, getNodeDef, SHADER_LANGUAGES, type IRModule, type ShaderLanguage } from '@/core'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useGraphStore } from '@/store/graphStore'
import { useUIStore } from '@/store/uiStore'

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

export default function CodePanel({ ir }: { ir: IRModule | null }) {
  const [copied, setCopied] = useState(false)
  const language = useUIStore((s) => s.codeLanguage)
  const lines = useMemo(() => (ir ? generateCodeLines(ir, language) : null), [ir, language])
  const code = useMemo(() => lines?.map((l) => l.text).join('\n') ?? null, [lines])
  const selected = useUIStore((s) => s.selected)
  const nodes = useGraphStore((s) => s.graph.nodes)
  const body = useRef<HTMLPreElement>(null)

  // Selecting a node brings its code into view (nothing moves when it is already visible).
  useEffect(() => {
    body.current?.querySelector('[data-lit]')?.scrollIntoView({ block: 'nearest' })
  }, [selected, lines])

  const copy = async () => {
    if (!code) return
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card/90 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between border-b px-3 py-1.5">
        <div className="flex gap-0.5" role="tablist" aria-label="Shading language">
          {SHADER_LANGUAGES.map((l) => (
            <button
              key={l}
              role="tab"
              aria-selected={l === language}
              onClick={() => useUIStore.getState().setCodeLanguage(l)}
              className={cn(
                'rounded-md px-2 py-1 text-sm',
                l === language ? 'bg-accent font-medium' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {LANGUAGE_LABELS[l]}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Copy code" title="Copy code" onClick={copy} disabled={!code}>
            {copied ? <Check /> : <Copy />}
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Close" title="Close" onClick={() => useUIStore.getState().toggleCode()}>
            <X />
          </Button>
        </div>
      </div>
      <pre ref={body} className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap">
        {lines === null ? (
          <span className="text-muted-foreground">The graph has an error, see the highlighted node.</span>
        ) : (
          lines.map(({ text, nodeId }, i) => {
            // A line produced by a node is linked to it: selecting the node lights the line up,
            // and clicking the line selects the node.
            const node = nodeId === undefined ? undefined : nodes[nodeId]
            const label = node && getNodeDef(node.type)?.label
            return (
              <div
                key={i}
                title={label ? `From the ${label} node` : undefined}
                data-lit={node && selected.has(node.id) ? '' : undefined}
                // Indentation is padding, so a wrapped long line stays aligned under its start.
                style={{ paddingLeft: `calc(0.75rem + ${text.length - text.trimStart().length}ch)` }}
                className={cn(
                  '-mx-3 border-l-2 border-transparent pr-3',
                  node && 'cursor-pointer hover:bg-accent/40',
                  node && selected.has(node.id) && 'border-selection bg-selection/10',
                )}
                onClick={node ? () => useUIStore.getState().setSelection([node.id]) : undefined}
              >
                {highlight(text.trimStart())}
                {text === '' && ' '}
              </div>
            )
          })
        )}
      </pre>
    </div>
  )
}
