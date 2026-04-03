import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface DeltaTimeNodeData {
  label?: string;
}

export default function DeltaTimeNode({ data }: { data: DeltaTimeNodeData }) {
  const outputs: PortDef[] = [{ label: 'dt', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Delta Time'} outputs={outputs} icon={<DeltaTimeIcon className="text-orange-400" size={14} strokeWidth={2.5} />}>
      <span className="text-xs font-mono text-zinc-500">delta</span>
    </NodeWrapper>
  );
}

function DeltaTimeIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}
