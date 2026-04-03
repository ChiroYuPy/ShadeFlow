import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface AbsNodeData {
  label?: string;
}

export default function AbsNode({ data }: { data: AbsNodeData }) {
  const inputs: PortDef[] = [{ label: 'x', shaderType: ShaderType.Float }];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Abs'} inputs={inputs} outputs={outputs} icon={<NodeIcon type="abs" />}>
      <span className="text-xl font-light text-zinc-500">|x|</span>
    </NodeWrapper>
  );
}
