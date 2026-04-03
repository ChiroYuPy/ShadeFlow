import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface AddNodeData {
  label?: string;
  type?: ShaderType;
}

export default function AddNode({ data }: { data: AddNodeData }) {
  const type = data.type ?? ShaderType.Float;

  const inputs: PortDef[] = [
    { label: 'a', shaderType: type },
    { label: 'b', shaderType: type },
  ];

  const outputs: PortDef[] = [{ label: 'out', shaderType: type }];

  return (
    <NodeWrapper title={data.label ?? 'Add'} inputs={inputs} outputs={outputs} icon={<PlusIcon className="text-green-400" size={14} strokeWidth={2.5} />}>
      <span className="text-2xl font-light text-zinc-500">+</span>
    </NodeWrapper>
  );
}

function PlusIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}
