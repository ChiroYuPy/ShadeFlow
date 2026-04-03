import { Handle, Position } from 'reactflow';
import { ShaderType } from '../types/ShaderType';

const HANDLE_COLORS: Record<ShaderType, string> = {
  [ShaderType.Float]: '#3b82f6',   // blue
  [ShaderType.Vec2]: '#10b981',    // emerald
  [ShaderType.Vec3]: '#f59e0b',    // amber
  [ShaderType.Vec4]: '#ef4444',    // red
};

interface PortProps {
  label: string;
  type: 'input' | 'output';
  shaderType: ShaderType;
}

/**
 * Port with label and handle colored by type
 */
export default function Port({ label, type, shaderType }: PortProps) {
  const handleType = type === 'input' ? 'target' : 'source';
  const position = type === 'input' ? Position.Left : Position.Right;
  const color = HANDLE_COLORS[shaderType];
  const id = `${shaderType}-${type}`;

  return (
    <div className="flex items-center gap-1.5">
      {type === 'input' && (
        <>
          <span className="text-xs text-zinc-400 truncate max-w-[50px]">{label}</span>
          <Handle
            type={handleType}
            position={position}
            id={id}
            style={{ backgroundColor: color, width: 10, height: 10 }}
          />
        </>
      )}
      {type === 'output' && (
        <>
          <Handle
            type={handleType}
            position={position}
            id={id}
            style={{ backgroundColor: color, width: 10, height: 10 }}
          />
          <span className="text-xs text-zinc-400 truncate max-w-[50px]">{label}</span>
        </>
      )}
    </div>
  );
}
