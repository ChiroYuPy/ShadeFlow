import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface ColorNodeData {
  label?: string;
  r?: number;
  g?: number;
  b?: number;
  a?: number;
}

export default function ColorNode({ data }: { data: ColorNodeData }) {
  const r = data.r ?? 1;
  const g = data.g ?? 1;
  const b = data.b ?? 1;
  const a = data.a ?? 1;

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Vec4 }];

  // Convert RGB values to CSS color string
  const colorStyle = {
    backgroundColor: `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`,
  };

  return (
    <NodeWrapper title={data.label ?? 'Color'} outputs={outputs} icon={<ColorIcon className="text-pink-400" size={14} strokeWidth={2.5} />}>
      <div className="w-12 h-12 rounded border border-zinc-600" style={colorStyle} />
    </NodeWrapper>
  );
}

function ColorIcon({ className, size, strokeWidth }: { className?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 0 1 10 10" className="text-red-500" strokeWidth={2.5} />
      <path d="M12 22a10 10 0 0 1-10-10" className="text-blue-500" strokeWidth={2.5} />
      <path d="M2 12a10 10 0 0 1 10-10" className="text-green-500" strokeWidth={2.5} />
      <path d="M22 12a10 10 0 0 1-10 10" className="text-yellow-500" strokeWidth={2.5} />
    </svg>
  );
}
