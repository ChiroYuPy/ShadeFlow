import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface NormalizeNodeData {
  label?: string;
}

export default function NormalizeNode({ data }: { data: NormalizeNodeData }) {
  const inputs: PortDef[] = [{ label: 'v', shaderType: ShaderType.Vec3 }];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Vec3 }];

  return (
    <NodeWrapper title={data.label ?? 'Normalize'} inputs={inputs} outputs={outputs} icon={<NormalizeIcon className="text-cyan-400" size={14} strokeWidth={2.5} />}>
      <span className="text-sm font-mono text-zinc-500">norm</span>
    </NodeWrapper>
  );
}

function NormalizeIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 5v4" />
      <path d="M12 15v4" />
      <path d="M5 12h4" />
      <path d="M15 12h4" />
    </svg>
  );
}
