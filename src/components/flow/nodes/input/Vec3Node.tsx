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
    <NodeWrapper title={data.label ?? 'Vec3'} outputs={outputs} typeLabel="vec3">
      <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-sm font-mono">
        <span className="text-amber-400">x: {x}</span>
        <span className="text-amber-400">y: {y}</span>
        <span className="text-amber-400">z: {z}</span>
      </div>
    </NodeWrapper>
  );
}
