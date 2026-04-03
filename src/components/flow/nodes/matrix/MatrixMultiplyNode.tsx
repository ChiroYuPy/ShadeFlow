import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface MatrixMultiplyNodeData {
  label?: string;
}

export default function MatrixMultiplyNode({ data }: { data: MatrixMultiplyNodeData }) {
  const inputs: PortDef[] = [
    { label: 'A', shaderType: 'mat4' as any },
    { label: 'B', shaderType: 'mat4' as any },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: 'mat4' as any }];

  return (
    <NodeWrapper title={data.label ?? 'Matrix Multiply'} inputs={inputs} outputs={outputs} icon={<NodeIcon type="matrixmultiply" />}>
      <span className="text-sm font-mono text-zinc-500">A×B</span>
    </NodeWrapper>
  );
}
