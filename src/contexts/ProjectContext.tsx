import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import type { Node, Edge } from 'reactflow';

interface ProjectData {
  name: string;
  nodes: Node[];
  edges: Edge[];
}

interface ProjectContextType {
  projectName: string;
  setProjectName: (name: string) => void;
  projectData: ProjectData | null;
  setProjectData: (data: ProjectData | null) => void;
  newProject: () => void;
  exportProject: () => void;
  importProject: () => void;
  registerFlowHandlers: (handlers: { export: () => void }) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projectName, setProjectName] = useState('Untitled Project');
  // Start with empty project
  const [projectData, setProjectDataState] = useState<ProjectData | null>(null);
  const flowHandlersRef = useRef<{ export: () => void } | null>(null);

  const setProjectData = useCallback((data: ProjectData | null) => {
    setProjectDataState(data);
  }, []);

  const newProject = useCallback(() => {
    console.log('newProject called');
    // Create new project without confirmation
    setProjectName('Untitled Project');
    // Create new project with Output node
    const newProjectData = {
      name: 'Untitled Project',
      nodes: [
        {
          id: 'output-0',
          type: 'output',
          position: { x: 500, y: 300 },
          data: {},
          dragHandle: '.node-drag-handle',
        }
      ],
      edges: []
    };
    console.log('Setting project data:', newProjectData);
    setProjectDataState(newProjectData);
  }, [setProjectName, setProjectDataState]);

  const exportProject = useCallback(() => {
    if (flowHandlersRef.current?.export) {
      flowHandlersRef.current.export();
    }
  }, []);

  const importProject = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string) as ProjectData;
            setProjectName(data.name);
            setProjectDataState(data);
            alert(`Project "${data.name}" imported successfully!`);
          } catch (error) {
            alert('Failed to import project: Invalid file format');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [setProjectName, setProjectDataState]);

  const registerFlowHandlers = useCallback((handlers: { export: () => void }) => {
    flowHandlersRef.current = handlers;
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        projectName,
        setProjectName,
        projectData,
        setProjectData,
        newProject,
        exportProject,
        importProject,
        registerFlowHandlers,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
