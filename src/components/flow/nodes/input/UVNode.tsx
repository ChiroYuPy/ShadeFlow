import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface UVNodeData {
  label?: string;
}

export default function UVNode({ data }: { data: UVNodeData }) {
  const outputs: PortDef[] = [{ label: 'uv', shaderType: ShaderType.Vec2 }];

  return (
    <NodeWrapper title={data.label ?? 'UV'} outputs={outputs} icon={<UVIcon className="text-cyan-400" size={14} strokeWidth={2.5} />}>
      <span className="text-xs font-mono text-zinc-500">uv</span>
    </NodeWrapper>
  );
}

function UVIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 3h18v18H3z" />
      <path d="M3 3l9 9 9-9" />
    </svg>
  );
}
