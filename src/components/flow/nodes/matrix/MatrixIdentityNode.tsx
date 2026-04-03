import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface MatrixIdentityNodeData {
  label?: string;
}

export default function MatrixIdentityNode({ data }: { data: MatrixIdentityNodeData }) {
  const outputs: PortDef[] = [{ label: 'out', shaderType: 'mat4' as any }];

  return (
    <NodeWrapper title={data.label ?? 'Identity'} outputs={outputs} icon={<NodeIcon type="matrixidentity" />}>
      <span className="text-xs font-mono text-zinc-500">I</span>
    </NodeWrapper>
  );
}
