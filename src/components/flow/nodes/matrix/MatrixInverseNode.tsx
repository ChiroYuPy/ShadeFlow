import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface MatrixInverseNodeData {
  label?: string;
}

export default function MatrixInverseNode({ data }: { data: MatrixInverseNodeData }) {
  const inputs: PortDef[] = [{ label: 'M', shaderType: 'mat4' as any }];

  const outputs: PortDef[] = [{ label: 'out', shaderType: 'mat4' as any }];

  return (
    <NodeWrapper title={data.label ?? 'Matrix Inverse'} inputs={inputs} outputs={outputs} icon={<NodeIcon type="matrixinverse" />}>
      <span className="text-xs font-mono text-zinc-500">M⁻¹</span>
    </NodeWrapper>
  );
}
