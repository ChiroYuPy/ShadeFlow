import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface OrNodeData {
  label?: string;
}

export default function OrNode({ data }: { data: OrNodeData }) {
  const inputs: PortDef[] = [
    { label: 'a', shaderType: ShaderType.Float },
    { label: 'b', shaderType: ShaderType.Float },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Or'} inputs={inputs} outputs={outputs} icon={<OrIcon className="text-sky-400" size={14} strokeWidth={2.5} />}>
      <span className="text-sm font-mono text-zinc-500">OR</span>
    </NodeWrapper>
  );
}

function OrIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 6v6a4 4 0 0 0 8 0V6" />
    </svg>
  );
}
