import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface CompareNodeData {
  label?: string;
  op?: '<' | '<=' | '==' | '!=' | '>' | '>=';
}

export default function CompareNode({ data }: { data: CompareNodeData }) {
  const op = data.op ?? '==';
  const label = data.label ?? `Compare ${op}`;

  const inputs: PortDef[] = [
    { label: 'a', shaderType: ShaderType.Float },
    { label: 'b', shaderType: ShaderType.Float },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={label} inputs={inputs} outputs={outputs} icon={<NodeIcon type="compare" />}>
      <span className="text-sm font-mono text-zinc-500">{op}</span>
    </NodeWrapper>
  );
}
