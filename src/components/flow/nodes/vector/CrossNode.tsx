import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface CrossNodeData {
  label?: string;
}

export default function CrossNode({ data }: { data: CrossNodeData }) {
  const inputs: PortDef[] = [
    { label: 'a', shaderType: ShaderType.Vec3 },
    { label: 'b', shaderType: ShaderType.Vec3 },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Vec3 }];

  return (
    <NodeWrapper title={data.label ?? 'Cross'} inputs={inputs} outputs={outputs} icon={<CrossIcon className="text-purple-400" size={14} strokeWidth={2.5} />}>
      <span className="text-sm font-mono text-zinc-500">a×b</span>
    </NodeWrapper>
  );
}

function CrossIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 4v16" />
      <path d="M4 12h16" />
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}
