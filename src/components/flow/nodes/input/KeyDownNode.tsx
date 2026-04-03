import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface KeyDownNodeData {
  label?: string;
  key?: string;
}

export default function KeyDownNode({ data }: { data: KeyDownNodeData }) {
  const outputs: PortDef[] = [{ label: 'pressed', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Key Down'} outputs={outputs} icon={<NodeIcon type="keydown" />}>
      <span className="text-xs font-mono text-zinc-500">{data.key ?? 'Space'}</span>
    </NodeWrapper>
  );
}
