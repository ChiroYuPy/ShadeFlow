import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface CompareNodeData {
  label?: string;
  op?: '<' | '<=' | '==' | '!=' | '>' | '>=';
}

export default function CompareNode({ data }: { data: CompareNodeData }) {
  const op = data.op ?? '==';
  const label = data.label ?? `Compare ${op}`;

  const inputs: PortDef[] = [
    { label: 'a', shaderType: ShaderType.Float },
    { label: 'b', shaderType: ShaderType.Float },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={label} inputs={inputs} outputs={outputs} icon={<CompareIcon className="text-yellow-400" size={14} strokeWidth={2.5} />}>
      <span className="text-sm font-mono text-zinc-500">{op}</span>
    </NodeWrapper>
  );
}

function CompareIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 9l4 4-4 4" />
      <path d="M15 9l4 4-4 4" />
    </svg>
  );
}
