import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface DotNodeData {
  label?: string;
}

export default function DotNode({ data }: { data: DotNodeData }) {
  const inputs: PortDef[] = [
    { label: 'a', shaderType: ShaderType.Vec3 },
    { label: 'b', shaderType: ShaderType.Vec3 },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Dot'} inputs={inputs} outputs={outputs} icon={<DotIcon className="text-blue-400" size={14} strokeWidth={2.5} />}>
      <span className="text-sm font-mono text-zinc-500">a·b</span>
    </NodeWrapper>
  );
}

function DotIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}
