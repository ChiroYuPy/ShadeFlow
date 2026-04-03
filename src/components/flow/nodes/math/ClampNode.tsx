import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface ClampNodeData {
  label?: string;
}

export default function ClampNode({ data }: { data: ClampNodeData }) {
  const inputs: PortDef[] = [
    { label: 'x', shaderType: ShaderType.Float },
    { label: 'min', shaderType: ShaderType.Float },
    { label: 'max', shaderType: ShaderType.Float },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Clamp'} inputs={inputs} outputs={outputs} icon={<NodeIcon type="clamp" />}>
      <span className="text-xs font-mono text-zinc-500">clamp</span>
    </NodeWrapper>
  );
}
