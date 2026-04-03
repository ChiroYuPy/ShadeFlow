import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface IfNodeData {
  label?: string;
}

export default function IfNode({ data }: { data: IfNodeData }) {
  const inputs: PortDef[] = [
    { label: 'cond', shaderType: ShaderType.Float },
    { label: 'true', shaderType: ShaderType.Float },
    { label: 'false', shaderType: ShaderType.Float },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'If'} inputs={inputs} outputs={outputs} icon={<IfIcon className="text-purple-400" size={14} strokeWidth={2.5} />}>
      <span className="text-xs font-mono text-zinc-500">if</span>
    </NodeWrapper>
  );
}

function IfIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 20h16" />
      <path d="M8 16l4-8 4 8" />
      <path d="M8 12l4-4 4 4" />
    </svg>
  );
}
