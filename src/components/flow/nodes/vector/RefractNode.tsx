import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface RefractNodeData {
  label?: string;
}

export default function RefractNode({ data }: { data: RefractNodeData }) {
  const inputs: PortDef[] = [
    { label: 'I', shaderType: ShaderType.Vec3 },
    { label: 'N', shaderType: ShaderType.Vec3 },
    { label: 'eta', shaderType: ShaderType.Float },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Vec3 }];

  return (
    <NodeWrapper title={data.label ?? 'Refract'} inputs={inputs} outputs={outputs} icon={<NodeIcon type="refract" />}>
      <span className="text-xs font-mono text-zinc-500">refract</span>
    </NodeWrapper>
  );
}
