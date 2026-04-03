import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface MultiplyNodeData {
  label?: string;
  type?: ShaderType;
}

export default function MultiplyNode({ data }: { data: MultiplyNodeData }) {
  const type = data.type ?? ShaderType.Float;

  const inputs: PortDef[] = [
    { label: 'a', shaderType: type },
    { label: 'b', shaderType: type },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: type }];

  return (
    <NodeWrapper title={data.label ?? 'Multiply'} inputs={inputs} outputs={outputs} typeLabel={type}>
      <span className="text-2xl font-light text-zinc-500">×</span>
    </NodeWrapper>
  );
}
