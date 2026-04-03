import type { Node, Edge } from 'reactflow';

type NodeData = any;

export function generateWGSL(nodes: Node<NodeData>[], edges: Edge[]): string {
  const codeLines: string[] = [];
  const nodeValues: Record<string, string> = {};

  const getInputValue = (nodeId: string, handleId: string): string => {
    const edge = edges.find((e) => e.target === nodeId && e.targetHandle === handleId);
    return edge ? nodeValues[edge.source] ?? edge.source : '0.0';
  };

  // Iterate through nodes (topological order would be better for dependencies)
  for (const node of nodes) {
    switch (node.type) {
      case 'float':
        nodeValues[node.id] = `${node.data?.value ?? 1}`;
        codeLines.push(`let ${node.id} = ${nodeValues[node.id]};`);
        break;
      case 'vec2':
        nodeValues[node.id] = `vec2(${node.data?.x ?? 0}, ${node.data?.y ?? 0})`;
        codeLines.push(`let ${node.id} = ${nodeValues[node.id]};`);
        break;
      case 'vec3':
        nodeValues[node.id] = `vec3(${node.data?.x ?? 0}, ${node.data?.y ?? 0}, ${node.data?.z ?? 0})`;
        codeLines.push(`let ${node.id} = ${nodeValues[node.id]};`);
        break;
      case 'vec4':
        nodeValues[node.id] = `vec4(${node.data?.x ?? 0}, ${node.data?.y ?? 0}, ${node.data?.z ?? 0}, ${node.data?.w ?? 0})`;
        codeLines.push(`let ${node.id} = ${nodeValues[node.id]};`);
        break;
      case 'add': {
        const nodeType = node.data?.type ?? 'float';
        const a = getInputValue(node.id, `${nodeType}-input-1`);
        const b = getInputValue(node.id, `${nodeType}-input-2`);
        nodeValues[node.id] = `${node.id}`;
        codeLines.push(`let ${node.id} = ${a} + ${b};`);
        break;
      }
      case 'multiply': {
        const nodeType = node.data?.type ?? 'float';
        const a = getInputValue(node.id, `${nodeType}-input-1`);
        const b = getInputValue(node.id, `${nodeType}-input-2`);
        nodeValues[node.id] = `${node.id}`;
        codeLines.push(`let ${node.id} = ${a} * ${b};`);
        break;
      }
    }
  }

  return codeLines.join('\n');
}
