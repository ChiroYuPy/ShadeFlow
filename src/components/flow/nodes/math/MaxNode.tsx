import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface MaxNodeData {
  label?: string;
}

export default function MaxNode({ data }: { data: MaxNodeData }) {
  const inputs: PortDef[] = [
    { label: 'a', shaderType: ShaderType.Float },
    { label: 'b', shaderType: ShaderType.Float },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Max'} inputs={inputs} outputs={outputs} icon={<MaxIcon className="text-rose-400" size={14} strokeWidth={2.5} />}>
      <span className="text-sm font-mono text-zinc-500">max(a,b)</span>
    </NodeWrapper>
  );
}

function MaxIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 6l6 6-6 6" />
      <path d="M2 12h20" />
    </svg>
  );
}
