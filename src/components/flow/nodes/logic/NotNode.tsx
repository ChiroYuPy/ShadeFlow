import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface NotNodeData {
  label?: string;
}

export default function NotNode({ data }: { data: NotNodeData }) {
  const inputs: PortDef[] = [{ label: 'x', shaderType: ShaderType.Float }];

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Not'} inputs={inputs} outputs={outputs} icon={<NotIcon className="text-red-400" size={14} strokeWidth={2.5} />}>
      <span className="text-sm font-mono text-zinc-500">NOT</span>
    </NodeWrapper>
  );
}

function NotIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16v.01" />
    </svg>
  );
}
