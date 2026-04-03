import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface DeltaTimeNodeData {
  label?: string;
}

export default function DeltaTimeNode({ data }: { data: DeltaTimeNodeData }) {
  const outputs: PortDef[] = [{ label: 'dt', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Delta Time'} outputs={outputs} icon={<NodeIcon type="deltatime" />}>
      <span className="text-xs font-mono text-zinc-500">delta</span>
    </NodeWrapper>
  );
}
