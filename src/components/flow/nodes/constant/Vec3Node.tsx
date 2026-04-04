import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface Vec3NodeData {
  label?: string;
  x?: number;
  y?: number;
  z?: number;
}

export default function Vec3Node({ data }: { data: Vec3NodeData }) {
  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Vec3 }];

  return (
    <NodeWrapper title={data.label ?? 'Vec3'} outputs={outputs} icon={<NodeIcon type="vec3" />}>
      <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-sm font-mono select-none">
        <span className="text-amber-400">x: {data.x ?? 0}</span>
        <span className="text-amber-400">y: {data.y ?? 0}</span>
        <span className="text-amber-400">z: {data.z ?? 0}</span>
      </div>
    </NodeWrapper>
  );
}
