import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface Vec2NodeData {
  label?: string;
  x?: number;
  y?: number;
}

export default function Vec2Node({ data }: { data: Vec2NodeData }) {
  const x = data.x ?? 0;
  const y = data.y ?? 0;

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Vec2 }];

  return (
    <NodeWrapper title={data.label ?? 'Vec2'} outputs={outputs} icon={<ArrowIcon className="text-emerald-400" size={14} strokeWidth={2.5} />}>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm font-mono">
        <span className="text-emerald-400">x: {x}</span>
        <span className="text-emerald-400">y: {y}</span>
      </div>
    </NodeWrapper>
  );
}

function ArrowIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  );
}
