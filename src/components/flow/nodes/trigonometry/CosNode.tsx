import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface CosNodeData {
  label?: string;
}

export default function CosNode({ data }: { data: CosNodeData }) {
  const inputs: PortDef[] = [{ label: 'x', shaderType: ShaderType.Float }];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Cos'} inputs={inputs} outputs={outputs} icon={<NodeIcon type="cos" />}>
      <span className="text-xl font-light text-zinc-500 italic">cos(x)</span>
    </NodeWrapper>
  );
}
