import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface CrossNodeData {
  label?: string;
}

export default function CrossNode({ data }: { data: CrossNodeData }) {
  const inputs: PortDef[] = [
    { label: 'a', shaderType: ShaderType.Vec3 },
    { label: 'b', shaderType: ShaderType.Vec3 },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Vec3 }];

  return (
    <NodeWrapper title={data.label ?? 'Cross'} inputs={inputs} outputs={outputs} icon={<NodeIcon type="cross" />}>
      <span className="text-sm font-mono text-zinc-500">a×b</span>
    </NodeWrapper>
  );
}
