import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface Vec3NodeData {
  label?: string;
  x?: number;
  y?: number;
  z?: number;
}

export default function Vec3Node({ data }: { data: Vec3NodeData }) {
  const x = data.x ?? 0;
  const y = data.y ?? 0;
  const z = data.z ?? 0;

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Vec3 }];

  return (
    <NodeWrapper title={data.label ?? 'Vec3'} outputs={outputs} icon={<BoxIcon className="text-amber-400" size={14} strokeWidth={2.5} />}>
      <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-sm font-mono">
        <span className="text-amber-400">x: {x}</span>
        <span className="text-amber-400">y: {y}</span>
        <span className="text-amber-400">z: {z}</span>
      </div>
    </NodeWrapper>
  );
}

function BoxIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
