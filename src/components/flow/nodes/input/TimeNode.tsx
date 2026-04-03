import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface TimeNodeData {
  label?: string;
}

export default function TimeNode({ data }: { data: TimeNodeData }) {
  const outputs: PortDef[] = [{ label: 't', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Time'} outputs={outputs} icon={<NodeIcon type="time" />}>
      <span className="text-xs font-mono text-zinc-500">time</span>
    </NodeWrapper>
  );
}
