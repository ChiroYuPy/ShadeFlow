import React from 'react';
import {
  Hash,
  ArrowRight,
  Box,
  Layers,
  Plus,
  X,
} from 'lucide-react';

export enum NodeType {
  Float = 'float',
  Vec2 = 'vec2',
  Vec3 = 'vec3',
  Vec4 = 'vec4',
  Add = 'add',
  Multiply = 'multiply',
}

const getIcon = (type: NodeType): React.ReactNode => {
  const iconProps = { size: 14, strokeWidth: 2.5 };

  switch (type) {
    case NodeType.Float:
      return <Hash {...iconProps} className="text-blue-400" />;
    case NodeType.Vec2:
      return <ArrowRight {...iconProps} className="text-emerald-400" />;
    case NodeType.Vec3:
      return <Box {...iconProps} className="text-amber-400" />;
    case NodeType.Vec4:
      return <Layers {...iconProps} className="text-red-400" />;
    case NodeType.Add:
      return <Plus {...iconProps} className="text-green-400" />;
    case NodeType.Multiply:
      return <X {...iconProps} className="text-purple-400" />;
    default:
      return null;
  }
};

export default getIcon;
