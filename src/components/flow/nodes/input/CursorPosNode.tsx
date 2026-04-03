import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface CursorPosNodeData {
  label?: string;
}

export default function CursorPosNode({ data }: { data: CursorPosNodeData }) {
  const outputs: PortDef[] = [{ label: 'pos', shaderType: ShaderType.Vec2 }];

  return (
    <NodeWrapper title={data.label ?? 'Cursor Pos'} outputs={outputs} icon={<CursorIcon className="text-blue-400" size={14} strokeWidth={2.5} />}>
      <span className="text-xs font-mono text-zinc-500">pos</span>
    </NodeWrapper>
  );
}

function CursorIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      <path d="M13 13l6 6" />
    </svg>
  );
}
