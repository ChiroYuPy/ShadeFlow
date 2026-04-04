import { useState, useEffect } from 'react';
import type { Node, Edge } from 'reactflow';
import { generateWGSL } from '../flow/utils/graphToWGSL';

interface CodeViewProps {
  nodes: Node[];
  edges: Edge[];
}

export default function CodeView({ nodes, edges }: CodeViewProps) {
  const [wgslCode, setWgslCode] = useState('// No nodes in the graph. Add nodes to generate WGSL code.');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (nodes.length === 0) {
      setWgslCode('// No nodes in the graph. Add nodes to generate WGSL code.');
      return;
    }

    try {
      const code = generateWGSL(nodes, edges);
      setWgslCode(code);
    } catch (error) {
      setWgslCode(`// Error generating WGSL:\n// ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [nodes, edges]);

  const handleCopy = () => {
    navigator.clipboard.writeText(wgslCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([wgslCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shader.wgsl';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      {/* Header with actions */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <h2 className="text-xs font-semibold text-white uppercase tracking-wide">Generated WGSL</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-xs text-zinc-300 hover:text-white transition-colors flex items-center gap-1"
          >
            {copied ? (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-xs text-zinc-300 hover:text-white transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download .wgsl
          </button>
        </div>
      </div>

      {/* Code editor */}
      <div className="flex-1 overflow-auto">
        <pre className="h-full p-4 text-sm font-mono text-green-400 bg-zinc-950">
          <code>{wgslCode}</code>
        </pre>
      </div>
    </div>
  );
}
