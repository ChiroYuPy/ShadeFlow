import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface OutputNodeData {
  label?: string;
}

export default function OutputNode({ data }: { data: OutputNodeData }) {
  const inputs: PortDef[] = [{ label: 'color', shaderType: ShaderType.Vec4 }];
  const outputs: PortDef[] = []; // Empty outputs array

  return (
    <NodeWrapper title={data.label ?? 'Output'} inputs={inputs} outputs={outputs} icon={<NodeIcon type="output" />}>
      <span className="text-xs font-mono text-zinc-500">final color</span>
    </NodeWrapper>
  );
}
