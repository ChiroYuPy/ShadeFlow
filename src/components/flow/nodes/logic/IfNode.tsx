import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface IfNodeData {
  label?: string;
}

export default function IfNode({ data }: { data: IfNodeData }) {
  const inputs: PortDef[] = [
    { label: 'cond', shaderType: ShaderType.Float },
    { label: 'true', shaderType: ShaderType.Float },
    { label: 'false', shaderType: ShaderType.Float },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'If'} inputs={inputs} outputs={outputs} icon={<NodeIcon type="if" />}>
      <span className="text-xs font-mono text-zinc-500">if</span>
    </NodeWrapper>
  );
}
