import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import getIcon, { NodeType } from '../NodeIcons';

export interface SubtractNodeData {
  label?: string;
  type?: ShaderType;
}

export default function SubtractNode({ data }: { data: SubtractNodeData }) {
  const type = data.type ?? ShaderType.Float;

  const inputs: PortDef[] = [
    { label: 'a', shaderType: type },
    { label: 'b', shaderType: type },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: type }];

  return (
    <NodeWrapper title={data.label ?? 'Subtract'} inputs={inputs} outputs={outputs} icon={<Minus className="text-orange-400" size={14} strokeWidth={2.5} />}>
      <span className="text-2xl font-light text-zinc-500">−</span>
    </NodeWrapper>
  );
}

function Minus({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14" />
    </svg>
  );
}
