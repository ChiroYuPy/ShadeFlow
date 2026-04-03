import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface CursorUpNodeData {
  label?: string;
}

export default function CursorUpNode({ data }: { data: CursorUpNodeData }) {
  const outputs: PortDef[] = [{ label: 'released', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Cursor Up'} outputs={outputs} icon={<NodeIcon type="cursorup" />}>
      <span className="text-xs font-mono text-zinc-500">release</span>
    </NodeWrapper>
  );
}
