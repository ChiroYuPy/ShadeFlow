import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';

export interface FloatNodeData {
  label?: string;
  value?: number;
}

export default function FloatNode({ data }: { data: FloatNodeData }) {
  const value = data.value ?? 1;

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  return (
    <NodeWrapper title={data.label ?? 'Float'} outputs={outputs} typeLabel="float">
      <div className="text-lg font-mono text-blue-400">{value}</div>
    </NodeWrapper>
  );
}
