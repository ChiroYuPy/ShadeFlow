import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface PowerNodeData {
  label?: string;
}

export default function PowerNode({ data }: { data: PowerNodeData }) {
  const inputs: PortDef[] = [
    { label: 'base', shaderType: ShaderType.Float },
    { label: 'exp', shaderType: ShaderType.Float },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Power'} inputs={inputs} outputs={outputs} icon={<PowerIcon className="text-yellow-400" size={14} strokeWidth={2.5} />}>
      <span className="text-xl font-light text-zinc-500">xʸ</span>
    </NodeWrapper>
  );
}

function PowerIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M7 12h10" />
      <path d="M15 8l4 4-4 4" />
      <path d="M5 16v-4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2z" transform="translate(0 -1) scale(0.7)" />
    </svg>
  );
}
