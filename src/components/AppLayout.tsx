import { useState } from 'react';
import Header from './ui/Header';
import FlowContentWrapper from './flow/Flow';
import { ProjectProvider, useProject } from '../contexts/ProjectContext';
import { FlowDataProvider, useFlowData } from '../contexts/FlowDataContext';
import CodeView from './code/CodeView';
import ShaderPreview from './render/ShaderPreview';
import PreviewOverlay from './ui/PreviewOverlay';

function AppLayoutContent() {
  const [currentView, setCurrentView] = useState<'graph' | 'code' | 'render'>('graph');
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
        {/* Center - View Content */}
        <div className="flex-1 relative">
          {currentView === 'graph' && (
            <div className="h-full">
              <FlowContentWrapper />
              <PreviewOverlay />
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
      </div>
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
