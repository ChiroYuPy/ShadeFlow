import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface DistanceNodeData {
  label?: string;
}

export default function DistanceNode({ data }: { data: DistanceNodeData }) {
  const inputs: PortDef[] = [
    { label: 'a', shaderType: ShaderType.Vec3 },
    { label: 'b', shaderType: ShaderType.Vec3 },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Distance'} inputs={inputs} outputs={outputs} icon={<DistanceIcon className="text-orange-400" size={14} strokeWidth={2.5} />}>
      <span className="text-sm font-mono text-zinc-500">dist</span>
    </NodeWrapper>
  );
}

function DistanceIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="9" cy="9" r="2" />
      <circle cx="15" cy="15" r="2" />
      <path d="M9 11c2-2 4-2 6 0" />
    </svg>
  );
}
