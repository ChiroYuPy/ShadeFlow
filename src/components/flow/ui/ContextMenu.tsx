import { useEffect } from 'react';

export interface ContextMenuProps {
  x: number;
  y: number;
  onDelete: () => void;
  onDuplicate: () => void;
  onClose: () => void;
}

export default function ContextMenu({ x, y, onDelete, onDuplicate, onClose }: ContextMenuProps) {
  useEffect(() => {
    const handleClickOutside = () => onClose();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      className="fixed z-50 min-w-[160px]"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-dark-bg-elevated border border-dark-border rounded-lg shadow-xl overflow-hidden">
        <button
          onClick={() => handleAction(onDuplicate)}
          className="w-full px-4 py-2.5 text-left text-sm text-dark-text hover:bg-dark-bg-hover transition-colors flex items-center gap-3"
        >
          <svg className="w-4 h-4 text-dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span>Duplicate</span>
          <span className="ml-auto text-xs text-dark-text-muted">Ctrl+D</span>
        </button>

        <button
          onClick={() => handleAction(onDelete)}
          className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-dark-bg-hover transition-colors flex items-center gap-3"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Delete</span>
          <span className="ml-auto text-xs text-dark-text-muted">Del</span>
        </button>
      </div>
    </div>
  );
}
