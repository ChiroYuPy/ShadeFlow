import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface RefractNodeData {
  label?: string;
}

export default function RefractNode({ data }: { data: RefractNodeData }) {
  const inputs: PortDef[] = [
    { label: 'I', shaderType: ShaderType.Vec3 },
    { label: 'N', shaderType: ShaderType.Vec3 },
    { label: 'eta', shaderType: ShaderType.Float },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Vec3 }];

  return (
    <NodeWrapper title={data.label ?? 'Refract'} inputs={inputs} outputs={outputs} icon={<RefractIcon className="text-indigo-400" size={14} strokeWidth={2.5} />}>
      <span className="text-xs font-mono text-zinc-500">refract</span>
    </NodeWrapper>
  );
}

function RefractIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 12h16" />
      <path d="M8 12l4-8 4 8" />
      <path d="M12 20l4-8" />
    </svg>
  );
}
