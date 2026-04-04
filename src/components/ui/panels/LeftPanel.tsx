interface LeftPanelProps {
  isOpen: boolean;
  activeTab: 'library';
  onClose: () => void;
}

export default function LeftPanel({ isOpen, activeTab, onClose }: LeftPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed left-0 top-14 bottom-0 w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col z-40">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <h2 className="text-xs font-semibold text-white uppercase tracking-wide">
          {activeTab === 'library' ? 'Node Library' : activeTab}
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Panel Content - Placeholder */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-center text-zinc-500 text-sm py-8">
          {activeTab === 'library' ? 'Drag & drop nodes here' : activeTab}
        </div>
      </div>
    </div>
  );
}
