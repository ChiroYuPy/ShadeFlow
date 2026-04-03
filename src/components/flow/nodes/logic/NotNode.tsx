import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface NotNodeData {
  label?: string;
}

export default function NotNode({ data }: { data: NotNodeData }) {
  const inputs: PortDef[] = [{ label: 'x', shaderType: ShaderType.Float }];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Not'} inputs={inputs} outputs={outputs} icon={<NodeIcon type="not" />}>
      <span className="text-sm font-mono text-zinc-500">NOT</span>
    </NodeWrapper>
  );
}
