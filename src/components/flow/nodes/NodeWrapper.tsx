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
  typeLabel?: string;
}

const PORT_HEIGHT = 24; // fixed height per port

export default function NodeWrapper({
  title,
  inputs = [],
  outputs = [],
  children,
  typeLabel,
}: NodeWrapperProps) {
  const contentHeight = Math.max(
    inputs.length * PORT_HEIGHT,
    outputs.length * PORT_HEIGHT,
    40, // minimum height
  );

  return (
    <div className="bg-zinc-800 text-white rounded-xl border border-zinc-600 overflow-hidden">
      {/* Fixed header */}
      <div className="px-3 py-2 border-b border-zinc-700 bg-zinc-800/50">
        <div className="text-sm font-medium">{title}</div>
        {typeLabel && <div className="text-xs text-zinc-400">{typeLabel}</div>}
      </div>

      {/* Content in 3 columns */}
      <div className="flex" style={{ minHeight: contentHeight }}>
        {/* Inputs column */}
        {inputs.length > 0 && (
          <div className="flex flex-col justify-center py-2 px-1 border-r border-zinc-700/50 bg-zinc-900/30 min-w-[60px]">
            {inputs.map((port, index) => (
              <div key={`input-${index}`} className="flex items-center h-6">
                <Port {...port} type="input" />
              </div>
            ))}
          </div>
        )}

        {/* Center column - custom content */}
        <div className="flex-1 p-2 flex items-center justify-center">
          {children}
        </div>

        {/* Outputs column */}
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
