import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface KeyUpNodeData {
  label?: string;
  key?: string;
}

export default function KeyUpNode({ data }: { data: KeyUpNodeData }) {
  const outputs: PortDef[] = [{ label: 'released', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Key Up'} outputs={outputs} icon={<NodeIcon type="keyup" />}>
      <span className="text-xs font-mono text-zinc-500">{data.key ?? 'Space'}</span>
    </NodeWrapper>
  );
}
