import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface ClampNodeData {
  label?: string;
}

export default function ClampNode({ data }: { data: ClampNodeData }) {
  const inputs: PortDef[] = [
    { label: 'x', shaderType: ShaderType.Float },
    { label: 'min', shaderType: ShaderType.Float },
    { label: 'max', shaderType: ShaderType.Float },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Clamp'} inputs={inputs} outputs={outputs} icon={<ClampIcon className="text-violet-400" size={14} strokeWidth={2.5} />}>
      <span className="text-xs font-mono text-zinc-500">clamp</span>
    </NodeWrapper>
  );
}

function ClampIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 6v12" />
      <path d="M20 6v12" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}
