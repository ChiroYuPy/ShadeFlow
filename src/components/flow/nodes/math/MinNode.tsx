import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface MinNodeData {
  label?: string;
}

export default function MinNode({ data }: { data: MinNodeData }) {
  const inputs: PortDef[] = [
    { label: 'a', shaderType: ShaderType.Float },
    { label: 'b', shaderType: ShaderType.Float },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Min'} inputs={inputs} outputs={outputs} icon={<NodeIcon type="min" />}>
      <span className="text-sm font-mono text-zinc-500">min(a,b)</span>
    </NodeWrapper>
  );
}
