import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface OrNodeData {
  label?: string;
}

export default function OrNode({ data }: { data: OrNodeData }) {
  const inputs: PortDef[] = [
    { label: 'a', shaderType: ShaderType.Float },
    { label: 'b', shaderType: ShaderType.Float },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Or'} inputs={inputs} outputs={outputs} icon={<NodeIcon type="or" />}>
      <span className="text-sm font-mono text-zinc-500">OR</span>
    </NodeWrapper>
  );
}
