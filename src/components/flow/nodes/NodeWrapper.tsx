import type { ReactNode } from 'react';
import { ShaderType } from '../types/ShaderType';
import Port from './Port';

export type PortDef = {
  label: string;
  shaderType: ShaderType;
};

interface NodeWrapperProps {
  title: string;
  inputs?: PortDef[];
  outputs?: PortDef[];
  children?: ReactNode;
  icon?: ReactNode;
}

const PORT_HEIGHT = 24;

export default function NodeWrapper({
                                      title,
                                      inputs = [],
                                      outputs = [],
                                      children,
                                      icon,
                                    }: NodeWrapperProps) {
  const contentHeight = Math.max(
    inputs.length * PORT_HEIGHT,
    outputs.length * PORT_HEIGHT,
    40,
  );

  return (
    <div className="bg-zinc-800 text-white rounded-xl border border-zinc-600 overflow-hidden">
      {/* Header */}
      <div className="node-drag-handle px-1.5 py-0.5 border-b border-zinc-700 bg-zinc-800/50 flex items-center gap-1.5 cursor-move">
        {/* Icon slot */}
        {icon && icon}

        {/* Title */}
        <div className="text-xs font-medium flex-1">{title}</div>
      </div>

      {/* Content */}
      <div className="flex" style={{ minHeight: contentHeight }}>
        {inputs.length > 0 && (
          <div className="flex flex-col justify-center py-2 px-1 border-r border-zinc-700/50 bg-zinc-900/30 min-w-[60px]">
            {inputs.map((port, index) => (
              <div key={`input-${index}`} className="flex items-center h-6">
                <Port {...port} type="input" />
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 p-2 flex items-center justify-center">
          {children}
        </div>

        {outputs.length > 0 && (
          <div className="flex flex-col justify-center py-2 px-1 border-l border-zinc-700/50 bg-zinc-900/30 min-w-[60px]">
            {outputs.map((port, index) => (
              <div key={`output-${index}`} className="flex items-center h-6 justify-end">
                <Port {...port} type="output" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { Port };