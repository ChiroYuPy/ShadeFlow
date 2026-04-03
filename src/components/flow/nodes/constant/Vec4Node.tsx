import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface Vec4NodeData {
  label?: string;
  x?: number;
  y?: number;
  z?: number;
  w?: number;
}

export default function Vec4Node({ data }: { data: Vec4NodeData }) {
  const x = data.x ?? 0;
  const y = data.y ?? 0;
  const z = data.z ?? 0;
  const w = data.w ?? 0;

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Vec4 }];

  return (
    <NodeWrapper title={data.label ?? 'Vec4'} outputs={outputs} icon={<LayersIcon className="text-red-400" size={14} strokeWidth={2.5} />}>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm font-mono">
        <span className="text-red-400">x: {x}</span>
        <span className="text-red-400">y: {y}</span>
        <span className="text-red-400">z: {z}</span>
        <span className="text-red-400">w: {w}</span>
      </div>
    </NodeWrapper>
  );
}

function LayersIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}
