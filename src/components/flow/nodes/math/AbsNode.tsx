import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface AbsNodeData {
  label?: string;
}

export default function AbsNode({ data }: { data: AbsNodeData }) {
  const inputs: PortDef[] = [{ label: 'x', shaderType: ShaderType.Float }];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Abs'} inputs={inputs} outputs={outputs} icon={<AbsIcon className="text-indigo-400" size={14} strokeWidth={2.5} />}>
      <span className="text-xl font-light text-zinc-500">|x|</span>
    </NodeWrapper>
  );
}

function AbsIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 3v18" />
      <path d="M6 12l6-9 6 9" />
      <path d="M18 3v18" />
    </svg>
  );
}
