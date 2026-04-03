import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface MatrixIdentityNodeData {
  label?: string;
}

export default function MatrixIdentityNode({ data }: { data: MatrixIdentityNodeData }) {
  const outputs: PortDef[] = [{ label: 'out', shaderType: 'mat4' as any }];

  return (
    <NodeWrapper title={data.label ?? 'Identity'} outputs={outputs} icon={<MatrixIcon className="text-blue-400" size={14} strokeWidth={2.5} />}>
      <span className="text-xs font-mono text-zinc-500">I</span>
    </NodeWrapper>
  );
}

function MatrixIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}
