import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface KeyUpNodeData {
  label?: string;
  key?: string;
}

export default function KeyUpNode({ data }: { data: KeyUpNodeData }) {
  const outputs: PortDef[] = [{ label: 'released', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Key Up'} outputs={outputs} icon={<KeyIcon className="text-red-400" size={14} strokeWidth={2.5} />}>
      <span className="text-xs font-mono text-zinc-500">{data.key ?? 'Space'}</span>
    </NodeWrapper>
  );
}

function KeyIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9H4.5a2 2 0 0 1 0-4H6" />
      <path d="M18 9h1.5a2 2 0 0 0 0-4H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
