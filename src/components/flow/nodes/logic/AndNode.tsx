import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface AndNodeData {
  label?: string;
}

export default function AndNode({ data }: { data: AndNodeData }) {
  const inputs: PortDef[] = [
    { label: 'a', shaderType: ShaderType.Float },
    { label: 'b', shaderType: ShaderType.Float },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'And'} inputs={inputs} outputs={outputs} icon={<AndIcon className="text-emerald-400" size={14} strokeWidth={2.5} />}>
      <span className="text-sm font-mono text-zinc-500">AND</span>
    </NodeWrapper>
  );
}

function AndIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 18v-6a4 4 0 0 1 8 0v6" />
      <path d="M8 14h8" />
    </svg>
  );
}
