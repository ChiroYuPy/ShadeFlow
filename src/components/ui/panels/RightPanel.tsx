import ShaderPreview from '../../render/ShaderPreview';
import { useFlowData } from '../../../contexts/FlowDataContext';

interface RightPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RightPanel({ isOpen, onClose }: RightPanelProps) {
  const { nodes, edges } = useFlowData();
  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-14 bottom-0 w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col z-40">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <h2 className="text-xs font-semibold text-white uppercase tracking-wide">Preview</h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Preview Section - Top Half */}
      <div className="flex-1 overflow-hidden border-b border-zinc-800">
        <ShaderPreview nodes={nodes} edges={edges} />
      </div>

      {/* Properties Section - Bottom Half */}
      <div className="flex-1 flex flex-col">
        <div className="px-3 py-2 border-b border-zinc-800">
          <h2 className="text-xs font-semibold text-white uppercase tracking-wide">Properties</h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-zinc-500">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-light text-zinc-600 mb-3">+</span>
            <span className="text-xs">Select a node to edit properties</span>
          </div>
        </div>
      </div>
    </div>
  );
}
