import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface AndNodeData {
  label?: string;
}

export default function AndNode({ data }: { data: AndNodeData }) {
  const inputs: PortDef[] = [
    { label: 'a', shaderType: ShaderType.Float },
    { label: 'b', shaderType: ShaderType.Float },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'And'} inputs={inputs} outputs={outputs} icon={<NodeIcon type="and" />}>
      <span className="text-sm font-mono text-zinc-500">AND</span>
    </NodeWrapper>
  );
}
