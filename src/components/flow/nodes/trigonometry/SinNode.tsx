import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface SinNodeData {
  label?: string;
}

export default function SinNode({ data }: { data: SinNodeData }) {
  const inputs: PortDef[] = [{ label: 'x', shaderType: ShaderType.Float }];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Sin'} inputs={inputs} outputs={outputs} icon={<NodeIcon type="sin" />}>
      <span className="text-xl font-light text-zinc-500 italic">sin(x)</span>
    </NodeWrapper>
  );
}
