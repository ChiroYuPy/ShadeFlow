import { useState } from 'react';
import { useFlowData } from '../../contexts/FlowDataContext';
import ShaderPreview from '../render/ShaderPreview';

export default function PreviewOverlay() {
  const [previewMinimized, setPreviewMinimized] = useState(false);
  const { nodes, edges } = useFlowData();

  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-end">
      {/* Toggle button - always visible */}
      <button
        onClick={() => setPreviewMinimized(!previewMinimized)}
        className="mr-2 p-2 bg-zinc-800/50 hover:bg-zinc-700/50 backdrop-blur rounded-lg transition-all"
        title={previewMinimized ? "Show preview" : "Hide preview"}
      >
        <svg className="w-4 h-4 text-zinc-500 hover:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {previewMinimized ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          )}
        </svg>
      </button>

      {/* Preview content - hidden when minimized */}
      {!previewMinimized && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden shadow-xl" style={{ width: '256px', height: '256px' }}>
          <ShaderPreview nodes={nodes} edges={edges} className="rounded-xl" />
        </div>
      )}
    </div>
  );
}
