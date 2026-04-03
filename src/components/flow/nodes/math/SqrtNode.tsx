import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface SqrtNodeData {
  label?: string;
}

export default function SqrtNode({ data }: { data: SqrtNodeData }) {
  const inputs: PortDef[] = [{ label: 'x', shaderType: ShaderType.Float }];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Sqrt'} inputs={inputs} outputs={outputs} icon={<SqrtIcon className="text-pink-400" size={14} strokeWidth={2.5} />}>
      <span className="text-xl font-light text-zinc-500">√</span>
    </NodeWrapper>
  );
}

function SqrtIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 19h14" />
      <path d="M5 19l4-14 4 6 4-6" />
    </svg>
  );
}
