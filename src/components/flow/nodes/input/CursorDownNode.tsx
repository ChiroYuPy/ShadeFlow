import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface CursorDownNodeData {
  label?: string;
}

export default function CursorDownNode({ data }: { data: CursorDownNodeData }) {
  const outputs: PortDef[] = [{ label: 'clicked', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Cursor Down'} outputs={outputs} icon={<NodeIcon type="cursordown" />}>
      <span className="text-xs font-mono text-zinc-500">click</span>
    </NodeWrapper>
  );
}
