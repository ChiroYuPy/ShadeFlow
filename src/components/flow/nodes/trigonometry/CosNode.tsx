import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface CosNodeData {
  label?: string;
}

export default function CosNode({ data }: { data: CosNodeData }) {
  const inputs: PortDef[] = [{ label: 'x', shaderType: ShaderType.Float }];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Cos'} inputs={inputs} outputs={outputs} icon={<TrigIcon className="text-blue-400" size={14} strokeWidth={2.5} />}>
      <span className="text-xl font-light text-zinc-500 italic">cos(x)</span>
    </NodeWrapper>
  );
}

function TrigIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 12s3-7 7-7 5 7 10 7 5-7 5-7" />
    </svg>
  );
}
