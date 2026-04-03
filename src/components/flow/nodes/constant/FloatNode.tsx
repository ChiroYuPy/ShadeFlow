import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface FloatNodeData {
  label?: string;
  value?: number;
}

export default function FloatNode({ data }: { data: FloatNodeData }) {
  const value = data.value ?? 1;

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Float'} outputs={outputs} icon={<HashIcon className="text-blue-400" size={14} strokeWidth={2.5} />}>
      <div className="text-lg font-mono text-blue-400">{value}</div>
    </NodeWrapper>
  );
}

function HashIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 9h16" />
      <path d="M4 15h16" />
      <path d="M10 3v18" />
      <path d="M14 3v18" />
    </svg>
  );
}
