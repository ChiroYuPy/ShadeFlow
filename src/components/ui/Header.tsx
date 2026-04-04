import React from 'react';
import { Download, Upload, FilePlus, Settings } from 'lucide-react';
import { getVersion } from '../../version';

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
      {/* Left - Logo, Project Name & Version */}
      <div className="flex items-center gap-3 w-96">
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
              className="flex items-center gap-3 cursor-pointer group"
              onClick={handleStartEdit}
            >
              <h1 className="text-sm font-semibold text-white truncate">{projectName}</h1>
              <span className="text-xs text-zinc-500 font-mono">v{getVersion()}</span>
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
          <FilePlus className="w-5 h-5" />
        </button>
        <button
          onClick={onExportProject}
          className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
          title="Export Project"
        >
          <Upload className="w-5 h-5" />
        </button>
        <button
          onClick={onLoadProject}
          className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
          title="Import Project"
        >
          <Download className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white" title="Settings">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
