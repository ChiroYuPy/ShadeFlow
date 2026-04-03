import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

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
    <NodeWrapper title={data.label ?? 'SmoothStep'} inputs={inputs} outputs={outputs} icon={<SmoothStepIcon className="text-sky-400" size={14} strokeWidth={2.5} />}>
      <span className="text-xs font-mono text-zinc-500">smooth</span>
    </NodeWrapper>
  );
}

function SmoothStepIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 18c0-8 4-8 6-8s6 0 6-8" />
    </svg>
  );
}
