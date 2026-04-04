import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Node, Edge } from 'reactflow';
import type { NodeData } from '../components/flow/types/FlowTypes';

interface FlowDataContextType {
  nodes: Node<NodeData>[];
  edges: Edge[];
  graphStructureHash: string;
  setNodes: (nodes: Node<NodeData>[] | ((prev: Node<NodeData>[]) => Node<NodeData>[])) => void;
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void;
  updateFlowData?: (nodes: Node<NodeData>[], edges: Edge[]) => void;
}

const FlowDataContext = createContext<FlowDataContextType | undefined>(undefined);

// Generate hash based only on graph structure (not positions)
function generateGraphHash(nodes: Node<NodeData>[], edges: Edge[]): string {
  const structureData = {
    nodes: nodes.map(n => ({
      id: n.id,
      type: n.type,
      data: n.data,
    })),
    edges: edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
    })),
  };
  return JSON.stringify(structureData);
}

export function FlowDataProvider({ children }: {
  children: ReactNode;
}) {
  const [nodes, setNodes] = useState<Node<NodeData>[]>([
    {
      id: 'output-0',
      type: 'shaderoutput',
      data: { label: 'Output' },
      position: { x: 500, y: 300 },
      dragHandle: '.node-drag-handle',
    }
  ]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Just compute hash on demand during render (no extra state)
  const graphStructureHash = generateGraphHash(nodes, edges);

  const updateFlowData = (newNodes: Node<NodeData>[], newEdges: Edge[]) => {
    setNodes(newNodes);
    setEdges(newEdges);
  };

  return (
    <FlowDataContext.Provider value={{ nodes, edges, graphStructureHash, setNodes, setEdges, updateFlowData }}>
      {children}
    </FlowDataContext.Provider>
  );
}

export function useFlowData() {
  const context = useContext(FlowDataContext);
  if (context === undefined) {
    throw new Error('useFlowData must be used within a FlowDataProvider');
  }
  return context;
}
