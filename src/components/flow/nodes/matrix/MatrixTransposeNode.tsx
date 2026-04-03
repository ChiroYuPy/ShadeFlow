import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface MatrixTransposeNodeData {
  label?: string;
}

export default function MatrixTransposeNode({ data }: { data: MatrixTransposeNodeData }) {
  const inputs: PortDef[] = [{ label: 'M', shaderType: 'mat4' as any }];

  const outputs: PortDef[] = [{ label: 'out', shaderType: 'mat4' as any }];

  return (
    <NodeWrapper title={data.label ?? 'Matrix Transpose'} inputs={inputs} outputs={outputs} icon={<NodeIcon type="matrixtranspose" />}>
      <span className="text-xs font-mono text-zinc-500">Mᵀ</span>
    </NodeWrapper>
  );
}
