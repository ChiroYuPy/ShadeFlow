import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface ColorNodeData {
  label?: string;
  r?: number;
  g?: number;
  b?: number;
  a?: number;
}

export default function ColorNode({ data }: { data: ColorNodeData }) {
  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Vec4 }];

  // Convert RGB values to CSS color string
  const r = data.r ?? 1;
  const g = data.g ?? 1;
  const b = data.b ?? 1;
  const a = data.a ?? 1;

  const colorStyle = {
    backgroundColor: `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`,
  };

  return (
    <NodeWrapper title={data.label ?? 'Color'} outputs={outputs} icon={<NodeIcon type="color" />}>
      <div className="w-12 h-12 rounded border border-zinc-600 select-none" style={colorStyle} />
    </NodeWrapper>
  );
}
