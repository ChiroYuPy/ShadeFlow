import { useState } from 'react';
import Header from './ui/Header';
import LeftPanel from './ui/panels/LeftPanel';
import RightPanel from './ui/panels/RightPanel';
import FlowContentWrapper from './flow/Flow';
import { ProjectProvider, useProject } from '../contexts/ProjectContext';
import { FlowDataProvider, useFlowData } from '../contexts/FlowDataContext';
import CodeView from './code/CodeView';
import ShaderPreview from './render/ShaderPreview';

function AppLayoutContent() {
  const [currentView, setCurrentView] = useState<'graph' | 'code' | 'render'>('graph');
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const { projectName, setProjectName, newProject, exportProject, importProject } = useProject();
  const { nodes, edges } = useFlowData();

  return (
    <div className="w-screen h-screen flex flex-col bg-zinc-900">
      {/* Header */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        projectName={projectName}
        onProjectNameChange={setProjectName}
        onNewProject={newProject}
        onLoadProject={importProject}
        onExportProject={exportProject}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex relative" style={{ marginTop: '3.5rem' }}>
        {/* Left Panel - Only for Graph view */}
        {currentView === 'graph' && (
          <LeftPanel
            isOpen={leftPanelOpen}
            activeTab="library"
            onClose={() => setLeftPanelOpen(false)}
          />
        )}

        {/* Center - View Content */}
        <div className="flex-1 relative">
          {currentView === 'graph' && (
            <div className="h-full">
              <FlowContentWrapper />
            </div>
          )}

          {currentView === 'code' && (
            <div className="h-full">
              <CodeView nodes={nodes} edges={edges} />
            </div>
          )}

          {currentView === 'render' && (
            <div className="h-full">
              <ShaderPreview nodes={nodes} edges={edges} />
            </div>
          )}
        </div>

        {/* Right Panel - Only for Graph view */}
        {currentView === 'graph' && (
          <RightPanel
            isOpen={rightPanelOpen}
            onClose={() => setRightPanelOpen(false)}
          />
        )}
      </div>

      {/* Panel Toggle Buttons - Only for Graph view */}
      {currentView === 'graph' && (
        <>
          {leftPanelOpen && (
            <button
              onClick={() => setLeftPanelOpen(false)}
              className="fixed left-72 top-1/2 -translate-y-1/2 z-50 p-2 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          )}

          {!leftPanelOpen && (
            <button
              onClick={() => setLeftPanelOpen(true)}
              className="fixed left-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {rightPanelOpen && (
            <button
              onClick={() => setRightPanelOpen(false)}
              className="fixed right-80 top-1/2 -translate-y-1/2 z-50 p-2 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {!rightPanelOpen && (
            <button
              onClick={() => setRightPanelOpen(true)}
              className="fixed right-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default function AppLayout() {
  return (
    <ProjectProvider>
      <FlowDataProvider>
        <AppLayoutContent />
      </FlowDataProvider>
    </ProjectProvider>
  );
}
