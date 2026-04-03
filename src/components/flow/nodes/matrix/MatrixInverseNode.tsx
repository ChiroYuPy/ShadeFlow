import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface MatrixInverseNodeData {
  label?: string;
}

export default function MatrixInverseNode({ data }: { data: MatrixInverseNodeData }) {
  const inputs: PortDef[] = [{ label: 'M', shaderType: 'mat4' as any }];

  const outputs: PortDef[] = [{ label: 'out', shaderType: 'mat4' as any }];

  return (
    <NodeWrapper title={data.label ?? 'Matrix Inverse'} inputs={inputs} outputs={outputs} icon={<InverseIcon className="text-red-400" size={14} strokeWidth={2.5} />}>
      <span className="text-xs font-mono text-zinc-500">M⁻¹</span>
    </NodeWrapper>
  );
}

function InverseIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 12h16" />
      <path d="M12 4v16" />
      <path d="M8 8l8 8" />
      <path d="M16 8l-8 8" />
    </svg>
  );
}
