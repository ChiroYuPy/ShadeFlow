import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface CursorPosNodeData {
  label?: string;
}

export default function CursorPosNode({ data }: { data: CursorPosNodeData }) {
  const outputs: PortDef[] = [{ label: 'pos', shaderType: ShaderType.Vec2 }];

  return (
    <NodeWrapper title={data.label ?? 'Cursor Pos'} outputs={outputs} icon={<NodeIcon type="cursorpos" />}>
      <span className="text-xs font-mono text-zinc-500">pos</span>
    </NodeWrapper>
  );
}
