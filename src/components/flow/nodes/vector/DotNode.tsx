import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface DotNodeData {
  label?: string;
}

export default function DotNode({ data }: { data: DotNodeData }) {
  const inputs: PortDef[] = [
    { label: 'a', shaderType: ShaderType.Vec3 },
    { label: 'b', shaderType: ShaderType.Vec3 },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Dot'} inputs={inputs} outputs={outputs} icon={<NodeIcon type="dot" />}>
      <span className="text-sm font-mono text-zinc-500">a·b</span>
    </NodeWrapper>
  );
}
