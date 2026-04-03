import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface TanNodeData {
  label?: string;
}

export default function TanNode({ data }: { data: TanNodeData }) {
  const inputs: PortDef[] = [{ label: 'x', shaderType: ShaderType.Float }];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Tan'} inputs={inputs} outputs={outputs} icon={<NodeIcon type="tan" />}>
      <span className="text-xl font-light text-zinc-500 italic">tan(x)</span>
    </NodeWrapper>
  );
}
