import React from 'react';

interface HeaderProps {
  currentView: 'graph' | 'code' | 'render';
  onViewChange: (view: 'graph' | 'code' | 'render') => void;
  projectName?: string;
  onProjectNameChange?: (name: string) => void;
  onNewProject?: () => void;
  onLoadProject?: () => void;
  onExportProject?: () => void;
}

export default function Header({
  currentView,
  onViewChange,
  projectName = 'Untitled Project',
  onProjectNameChange,
  onNewProject,
  onLoadProject,
  onExportProject,
}: HeaderProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [tempName, setTempName] = React.useState(projectName);

  const handleStartEdit = () => {
    setTempName(projectName);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (tempName.trim() && onProjectNameChange) {
      onProjectNameChange(tempName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setTempName(projectName);
      setIsEditing(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-zinc-900 border-b border-zinc-800 flex items-center px-4">
      {/* Left - Logo & Project Name */}
      <div className="flex items-center gap-3 w-80">
        <img src={`${import.meta.env.BASE_URL}icon.png`} alt="ShadeFlow" className="w-8 h-8 rounded-lg" />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyDown}
              className="w-full bg-zinc-800 border border-blue-500 rounded px-2 py-1 text-sm text-white outline-none"
              autoFocus
            />
          ) : (
            <div
              className="flex items-center gap-2 cursor-pointer group"
              onClick={handleStartEdit}
            >
              <h1 className="text-sm font-semibold text-white truncate">{projectName}</h1>
              <svg className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Center - Navigation */}
      <div className="flex-1 flex items-center justify-center gap-1">
        <button
          onClick={() => onViewChange('graph')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            currentView === 'graph'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            Graph
          </span>
        </button>
        <button
          onClick={() => onViewChange('code')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            currentView === 'code'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Code
          </span>
        </button>
        <button
          onClick={() => onViewChange('render')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            currentView === 'render'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Render
          </span>
        </button>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2 w-80 justify-end">
        <button
          onClick={onNewProject}
          className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
          title="New Project"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={onExportProject}
          className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
          title="Export Project"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-8-8l4 4m0 0l4-4m-4 4V4" />
          </svg>
        </button>
        <button
          onClick={onLoadProject}
          className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
          title="Import Project"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </button>
        <button className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white" title="Settings">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </button>
      </div>
    </header>
  );
}
