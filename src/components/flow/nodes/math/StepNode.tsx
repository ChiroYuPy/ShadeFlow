import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

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
    <NodeWrapper title={data.label ?? 'Step'} inputs={inputs} outputs={outputs} icon={<StepIcon className="text-lime-400" size={14} strokeWidth={2.5} />}>
      <span className="text-xs font-mono text-zinc-500">step</span>
    </NodeWrapper>
  );
}

function StepIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 18v-8a2 2 0 0 1 2-2h8a2 2 0 0 0 2-2V4" />
    </svg>
  );
}
