import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface Vec4NodeData {
  label?: string;
  x?: number;
  y?: number;
  z?: number;
  w?: number;
}

export default function Vec4Node({ data }: { data: Vec4NodeData }) {
  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Vec4 }];

  return (
    <NodeWrapper title={data.label ?? 'Vec4'} outputs={outputs} icon={<NodeIcon type="vec4" />}>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm font-mono select-none">
        <span className="text-red-400">x: {data.x ?? 0}</span>
        <span className="text-red-400">y: {data.y ?? 0}</span>
        <span className="text-red-400">z: {data.z ?? 0}</span>
        <span className="text-red-400">w: {data.w ?? 0}</span>
      </div>
    </NodeWrapper>
  );
}
