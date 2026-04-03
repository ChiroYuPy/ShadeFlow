import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import getIcon, { NodeType } from '../NodeIcons';

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
    <NodeWrapper title={data.label ?? 'Vec2'} outputs={outputs} icon={getIcon(NodeType.Vec2)}>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm font-mono">
        <span className="text-emerald-400">x: {x}</span>
        <span className="text-emerald-400">y: {y}</span>
      </div>
    </NodeWrapper>
  );
}
