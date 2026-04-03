import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface DivideNodeData {
  label?: string;
  type?: ShaderType;
}

export default function DivideNode({ data }: { data: DivideNodeData }) {
  const type = data.type ?? ShaderType.Float;

  const inputs: PortDef[] = [
    { label: 'a', shaderType: type },
    { label: 'b', shaderType: type },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: type }];

  return (
    <NodeWrapper title={data.label ?? 'Divide'} inputs={inputs} outputs={outputs} icon={<NodeIcon type="divide" />}>
      <span className="text-2xl font-light text-zinc-500">÷</span>
    </NodeWrapper>
  );
}
