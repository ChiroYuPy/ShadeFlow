import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface LengthNodeData {
  label?: string;
}

export default function LengthNode({ data }: { data: LengthNodeData }) {
  const inputs: PortDef[] = [{ label: 'v', shaderType: ShaderType.Vec3 }];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Length'} inputs={inputs} outputs={outputs} icon={<LengthIcon className="text-green-400" size={14} strokeWidth={2.5} />}>
      <span className="text-sm font-mono text-zinc-500">|v|</span>
    </NodeWrapper>
  );
}

function LengthIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 19L19 5" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="5" r="2" />
    </svg>
  );
}
