import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface SqrtNodeData {
  label?: string;
}

export default function SqrtNode({ data }: { data: SqrtNodeData }) {
  const inputs: PortDef[] = [{ label: 'x', shaderType: ShaderType.Float }];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Sqrt'} inputs={inputs} outputs={outputs} icon={<NodeIcon type="sqrt" />}>
      <span className="text-xl font-light text-zinc-500">√</span>
    </NodeWrapper>
  );
}
