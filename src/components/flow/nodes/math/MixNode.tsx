import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface MixNodeData {
  label?: string;
  type?: ShaderType;
}

export default function MixNode({ data }: { data: MixNodeData }) {
  const type = data.type ?? ShaderType.Float;

  const inputs: PortDef[] = [
    { label: 'a', shaderType: type },
    { label: 'b', shaderType: type },
    { label: 't', shaderType: ShaderType.Float },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: type }];

  return (
    <NodeWrapper title={data.label ?? 'Mix'} inputs={inputs} outputs={outputs} icon={<MixIcon className="text-fuchsia-400" size={14} strokeWidth={2.5} />}>
      <span className="text-sm font-mono text-zinc-500">mix</span>
    </NodeWrapper>
  );
}

function MixIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 12h4" />
      <path d="M16 12h4" />
      <circle cx="8" cy="12" r="2" />
      <circle cx="16" cy="12" r="2" />
      <path d="M10 12h4" />
    </svg>
  );
}
