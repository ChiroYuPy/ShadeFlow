import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface StepNodeData {
  label?: string;
}

export default function StepNode({ data }: { data: StepNodeData }) {
  const inputs: PortDef[] = [
    { label: 'edge', shaderType: ShaderType.Float },
    { label: 'x', shaderType: ShaderType.Float },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Step'} inputs={inputs} outputs={outputs} icon={<NodeIcon type="step" />}>
      <span className="text-xs font-mono text-zinc-500">step</span>
    </NodeWrapper>
  );
}
