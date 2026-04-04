import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface FloatNodeData {
  label?: string;
  value?: number;
}

export default function FloatNode({ data }: { data: FloatNodeData }) {
  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Float'} outputs={outputs} icon={<NodeIcon type="float" />}>
      <div className="text-lg font-mono text-blue-400 select-none">
        {data.value ?? 1}
      </div>
    </NodeWrapper>
  );
}
