import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface Vec2NodeData {
  label?: string;
  x?: number;
  y?: number;
}

export default function Vec2Node({ data }: { data: Vec2NodeData }) {
  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Vec2 }];

  return (
    <NodeWrapper title={data.label ?? 'Vec2'} outputs={outputs} icon={<NodeIcon type="vec2" />}>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm font-mono select-none">
        <span className="text-emerald-400">x: {data.x ?? 0}</span>
        <span className="text-emerald-400">y: {data.y ?? 0}</span>
      </div>
    </NodeWrapper>
  );
}
