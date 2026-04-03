import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface ReflectNodeData {
  label?: string;
}

export default function ReflectNode({ data }: { data: ReflectNodeData }) {
  const inputs: PortDef[] = [
    { label: 'I', shaderType: ShaderType.Vec3 },
    { label: 'N', shaderType: ShaderType.Vec3 },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Vec3 }];

  return (
    <NodeWrapper title={data.label ?? 'Reflect'} inputs={inputs} outputs={outputs} icon={<ReflectIcon className="text-pink-400" size={14} strokeWidth={2.5} />}>
      <span className="text-xs font-mono text-zinc-500">reflect</span>
    </NodeWrapper>
  );
}

function ReflectIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 12h16" />
      <path d="M12 4l-4 8h8l-4 8" />
    </svg>
  );
}
