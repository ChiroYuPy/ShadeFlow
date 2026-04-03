import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface ReflectNodeData {
  label?: string;
}

export default function ReflectNode({ data }: { data: ReflectNodeData }) {
  const inputs: PortDef[] = [
    { label: 'I', shaderType: ShaderType.Vec3 },
    { label: 'N', shaderType: ShaderType.Vec3 },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Vec3 }];

  return (
    <NodeWrapper title={data.label ?? 'Reflect'} inputs={inputs} outputs={outputs} icon={<NodeIcon type="reflect" />}>
      <span className="text-xs font-mono text-zinc-500">reflect</span>
    </NodeWrapper>
  );
}
