import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface MixNodeData {
  label?: string;
  type?: ShaderType;
}

export default function MixNode({ data }: { data: MixNodeData }) {
  const type = data.type ?? ShaderType.Float;

  const inputs: PortDef[] = [
    { label: 'a', shaderType: type },
    { label: 'b', shaderType: type },
    { label: 't', shaderType: ShaderType.Float },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: type }];

  return (
    <NodeWrapper title={data.label ?? 'Mix'} inputs={inputs} outputs={outputs} icon={<NodeIcon type="mix" />}>
      <span className="text-sm font-mono text-zinc-500">mix</span>
    </NodeWrapper>
  );
}
