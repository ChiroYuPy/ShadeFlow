import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface TimeNodeData {
  label?: string;
}

export default function TimeNode({ data }: { data: TimeNodeData }) {
  const outputs: PortDef[] = [{ label: 't', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Time'} outputs={outputs} icon={<TimeIcon className="text-amber-400" size={14} strokeWidth={2.5} />}>
      <span className="text-xs font-mono text-zinc-500">time</span>
    </NodeWrapper>
  );
}

function TimeIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}
