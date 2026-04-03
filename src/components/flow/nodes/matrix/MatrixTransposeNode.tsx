import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface MatrixTransposeNodeData {
  label?: string;
}

export default function MatrixTransposeNode({ data }: { data: MatrixTransposeNodeData }) {
  const inputs: PortDef[] = [{ label: 'M', shaderType: 'mat4' as any }];

  const outputs: PortDef[] = [{ label: 'out', shaderType: 'mat4' as any }];

  return (
    <NodeWrapper title={data.label ?? 'Matrix Transpose'} inputs={inputs} outputs={outputs} icon={<TransposeIcon className="text-green-400" size={14} strokeWidth={2.5} />}>
      <span className="text-xs font-mono text-zinc-500">Mᵀ</span>
    </NodeWrapper>
  );
}

function TransposeIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3v18" />
      <path d="M3 12h18" />
      <path d="M8 8l4-4 4 4" />
      <path d="M12 4v16" />
    </svg>
  );
}
