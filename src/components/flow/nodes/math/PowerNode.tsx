import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface PowerNodeData {
  label?: string;
}

export default function PowerNode({ data }: { data: PowerNodeData }) {
  const inputs: PortDef[] = [
    { label: 'base', shaderType: ShaderType.Float },
    { label: 'exp', shaderType: ShaderType.Float },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Power'} inputs={inputs} outputs={outputs} icon={<NodeIcon type="power" />}>
      <span className="text-xl font-light text-zinc-500">xʸ</span>
    </NodeWrapper>
  );
}
