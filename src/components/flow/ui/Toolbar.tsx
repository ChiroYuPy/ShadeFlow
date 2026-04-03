interface ToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
}

export default function Toolbar({
  onZoomIn,
  onZoomOut,
  onFitView,
  onUndo,
  onRedo,
  onDuplicate,
  onDelete,
  canUndo,
  canRedo,
  hasSelection,
}: ToolbarProps) {
  const toolbarItems = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v2m0-2h3m-3 0H7" />
        </svg>
      ),
      label: 'Fit View',
      action: onFitView,
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
        </svg>
      ),
      label: 'Zoom Out',
      action: onZoomOut,
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6" />
        </svg>
      ),
      label: 'Zoom In',
      action: onZoomIn,
    },
    { separator: true },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      ),
      label: 'Undo (Ctrl+Z)',
      action: onUndo,
      disabled: !canUndo,
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
        </svg>
      ),
      label: 'Redo (Ctrl+Y)',
      action: onRedo,
      disabled: !canRedo,
    },
    { separator: true },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Duplicate (Ctrl+D)',
      action: onDuplicate,
      disabled: !hasSelection,
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      label: 'Delete (Del)',
      action: onDelete,
      disabled: !hasSelection,
      danger: true,
    },
  ];

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 bg-zinc-800/95 backdrop-blur-sm border border-zinc-700 rounded-lg shadow-2xl px-1.5 py-1.5">
        {toolbarItems.map((item, index) => {
          if ('separator' in item) {
            return (
              <div key={`sep-${index}`} className="w-px h-6 bg-zinc-700 mx-1" />
            );
          }

          const IconItem = item.icon;
          const isDisabled = item.disabled || false;

          return (
            <button
              key={index}
              onClick={item.action}
              disabled={isDisabled}
              className={`relative group p-2 rounded-lg transition-all duration-200 ${
                isDisabled
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-zinc-700 active:bg-zinc-600 cursor-pointer'
              }`}
              title={item.label}
            >
              <div className={`${
                item.danger ? 'text-red-400' : 'text-zinc-300'
              } ${!isDisabled ? 'group-hover:text-white' : ''} transition-colors`}>
                {IconItem}
              </div>
              {/* Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {item.label}
                <div className="absolute -top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 border-l border-t border-zinc-700 transform rotate-45" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
