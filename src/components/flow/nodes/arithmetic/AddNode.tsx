import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface AddNodeData {
  label?: string;
  type?: ShaderType;
}

export default function AddNode({ data }: { data: AddNodeData }) {
  const type = data.type ?? ShaderType.Float;

  const inputs: PortDef[] = [
    { label: 'a', shaderType: type },
    { label: 'b', shaderType: type },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: type }];

  return (
    <NodeWrapper title={data.label ?? 'Add'} inputs={inputs} outputs={outputs} icon={<NodeIcon type="add" />}>
      <span className="text-2xl font-light text-zinc-500">+</span>
    </NodeWrapper>
  );
}
