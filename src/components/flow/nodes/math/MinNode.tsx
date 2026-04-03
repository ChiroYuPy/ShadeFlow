import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface MinNodeData {
  label?: string;
}

export default function MinNode({ data }: { data: MinNodeData }) {
  const inputs: PortDef[] = [
    { label: 'a', shaderType: ShaderType.Float },
    { label: 'b', shaderType: ShaderType.Float },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Min'} inputs={inputs} outputs={outputs} icon={<MinIcon className="text-teal-400" size={14} strokeWidth={2.5} />}>
      <span className="text-sm font-mono text-zinc-500">min(a,b)</span>
    </NodeWrapper>
  );
}

function MinIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 6l-6 6 6 6" />
      <path d="M2 12h20" />
    </svg>
  );
}
