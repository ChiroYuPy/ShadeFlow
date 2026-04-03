import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface MatrixMultiplyNodeData {
  label?: string;
}

export default function MatrixMultiplyNode({ data }: { data: MatrixMultiplyNodeData }) {
  const inputs: PortDef[] = [
    { label: 'A', shaderType: 'mat4' as any },
    { label: 'B', shaderType: 'mat4' as any },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: 'mat4' as any }];

  return (
    <NodeWrapper title={data.label ?? 'Matrix Multiply'} inputs={inputs} outputs={outputs} icon={<MultiplyIcon className="text-purple-400" size={14} strokeWidth={2.5} />}>
      <span className="text-sm font-mono text-zinc-500">A×B</span>
    </NodeWrapper>
  );
}

function MultiplyIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
