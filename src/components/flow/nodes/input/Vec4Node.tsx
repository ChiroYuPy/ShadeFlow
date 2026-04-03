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
    <NodeWrapper title={data.label ?? 'Vec4'} outputs={outputs} typeLabel="vec4">
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm font-mono">
        <span className="text-red-400">x: {x}</span>
        <span className="text-red-400">y: {y}</span>
        <span className="text-red-400">z: {z}</span>
        <span className="text-red-400">w: {w}</span>
      </div>
    </NodeWrapper>
  );
}
