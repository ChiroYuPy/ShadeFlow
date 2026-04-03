import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface UVNodeData {
  label?: string;
}

export default function UVNode({ data }: { data: UVNodeData }) {
  const outputs: PortDef[] = [{ label: 'uv', shaderType: ShaderType.Vec2 }];

  return (
    <NodeWrapper title={data.label ?? 'UV'} outputs={outputs} icon={<NodeIcon type="uv" />}>
      <span className="text-xs font-mono text-zinc-500">uv</span>
    </NodeWrapper>
  );
}
