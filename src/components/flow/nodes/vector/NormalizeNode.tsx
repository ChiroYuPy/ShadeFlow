import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface NormalizeNodeData {
  label?: string;
}

export default function NormalizeNode({ data }: { data: NormalizeNodeData }) {
  const inputs: PortDef[] = [{ label: 'v', shaderType: ShaderType.Vec3 }];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Vec3 }];

  return (
    <NodeWrapper title={data.label ?? 'Normalize'} inputs={inputs} outputs={outputs} icon={<NodeIcon type="normalize" />}>
      <span className="text-sm font-mono text-zinc-500">norm</span>
    </NodeWrapper>
  );
}
