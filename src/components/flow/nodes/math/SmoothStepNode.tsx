import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface SmoothStepNodeData {
  label?: string;
}

export default function SmoothStepNode({ data }: { data: SmoothStepNodeData }) {
  const inputs: PortDef[] = [
    { label: 'edge0', shaderType: ShaderType.Float },
    { label: 'edge1', shaderType: ShaderType.Float },
    { label: 'x', shaderType: ShaderType.Float },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'SmoothStep'} inputs={inputs} outputs={outputs} icon={<NodeIcon type="smoothstep" />}>
      <span className="text-xs font-mono text-zinc-500">smooth</span>
    </NodeWrapper>
  );
}
