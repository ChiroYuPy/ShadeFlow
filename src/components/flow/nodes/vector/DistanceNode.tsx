import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface DistanceNodeData {
  label?: string;
}

export default function DistanceNode({ data }: { data: DistanceNodeData }) {
  const inputs: PortDef[] = [
    { label: 'a', shaderType: ShaderType.Vec3 },
    { label: 'b', shaderType: ShaderType.Vec3 },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Distance'} inputs={inputs} outputs={outputs} icon={<NodeIcon type="distance" />}>
      <span className="text-sm font-mono text-zinc-500">dist</span>
    </NodeWrapper>
  );
}
