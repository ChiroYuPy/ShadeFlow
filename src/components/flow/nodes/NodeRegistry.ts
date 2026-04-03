export interface NodeCategory {
  name: string;
  nodes: NodeInfo[];
}

export interface NodeInfo {
  type: string;
  label: string;
  description?: string;
  shortcut?: string;
  category: string;
}

export const nodeRegistry: NodeInfo[] = [
  // Constants
  { type: 'float', label: 'Float', description: 'Constant float value', shortcut: '1', category: 'constant' },
  { type: 'vec2', label: 'Vec2', description: '2D vector constant', shortcut: '2', category: 'constant' },
  { type: 'vec3', label: 'Vec3', description: '3D vector constant', shortcut: '3', category: 'constant' },
  { type: 'vec4', label: 'Vec4', description: '4D vector constant', shortcut: '4', category: 'constant' },
  { type: 'color', label: 'Color', description: 'RGBA color (1,1,1,1)', shortcut: '²', category: 'constant' },

  // Arithmetic
  { type: 'add', label: 'Add', description: 'Addition a + b', shortcut: '5', category: 'arithmetic' },
  { type: 'subtract', label: 'Subtract', description: 'Subtraction a - b', shortcut: '6', category: 'arithmetic' },
  { type: 'multiply', label: 'Multiply', description: 'Multiplication a × b', shortcut: '7', category: 'arithmetic' },
  { type: 'divide', label: 'Divide', description: 'Division a / b', shortcut: '8', category: 'arithmetic' },

  // Math
  { type: 'power', label: 'Power', description: 'Exponentiation', shortcut: '9', category: 'math' },
  { type: 'sqrt', label: 'Sqrt', description: 'Square root', shortcut: '0', category: 'math' },
  { type: 'abs', label: 'Abs', description: 'Absolute value', shortcut: 'q', category: 'math' },
  { type: 'min', label: 'Min', description: 'Minimum of two values', shortcut: 'w', category: 'math' },
  { type: 'max', label: 'Max', description: 'Maximum of two values', shortcut: 'e', category: 'math' },
  { type: 'clamp', label: 'Clamp', description: 'Clamp value between min and max', shortcut: 'r', category: 'math' },
  { type: 'mix', label: 'Mix', description: 'Linear interpolation (lerp)', shortcut: 't', category: 'math' },
  { type: 'step', label: 'Step', description: 'Step function', shortcut: 'y', category: 'math' },
  { type: 'smoothstep', label: 'SmoothStep', description: 'Smooth Hermite interpolation', shortcut: 'u', category: 'math' },

  // Trigonometry
  { type: 'sin', label: 'Sin', description: 'Sine function', shortcut: 'i', category: 'trigonometry' },
  { type: 'cos', label: 'Cos', description: 'Cosine function', shortcut: 'o', category: 'trigonometry' },
  { type: 'tan', label: 'Tan', description: 'Tangent function', shortcut: 'p', category: 'trigonometry' },

  // Logic
  { type: 'and', label: 'And', description: 'Logical AND', shortcut: 'z', category: 'logic' },
  { type: 'or', label: 'Or', description: 'Logical OR', shortcut: 'x', category: 'logic' },
  { type: 'not', label: 'Not', description: 'Logical NOT', shortcut: 'c', category: 'logic' },
  { type: 'compare', label: 'Compare', description: 'Comparison (==, !=, <, >, <=, >=)', shortcut: 'v', category: 'logic' },
  { type: 'if', label: 'If', description: 'Conditional selection (if/else)', shortcut: 'b', category: 'logic' },

  // Vector
  { type: 'dot', label: 'Dot', description: 'Dot product', shortcut: 'f', category: 'vector' },
  { type: 'cross', label: 'Cross', description: 'Cross product', shortcut: 'g', category: 'vector' },
  { type: 'normalize', label: 'Normalize', description: 'Normalize vector', shortcut: 'h', category: 'vector' },
  { type: 'length', label: 'Length', description: 'Vector length', shortcut: 'j', category: 'vector' },
  { type: 'distance', label: 'Distance', description: 'Distance between points', shortcut: 'k', category: 'vector' },
  { type: 'reflect', label: 'Reflect', description: 'Reflection vector', shortcut: 'l', category: 'vector' },
  { type: 'refract', label: 'Refract', description: 'Refraction vector', shortcut: ';', category: 'vector' },

  // Matrix
  { type: 'matrixidentity', label: 'Identity', description: 'Identity matrix', category: 'matrix' },
  { type: 'matrixmultiply', label: 'Matrix Multiply', description: 'Matrix multiplication', category: 'matrix' },
  { type: 'matrixinverse', label: 'Matrix Inverse', description: 'Matrix inverse', category: 'matrix' },
  { type: 'matrixtranspose', label: 'Matrix Transpose', description: 'Matrix transpose', category: 'matrix' },

  // Input values (system/user)
  { type: 'time', label: 'Time', description: 'Current time', shortcut: 'a', category: 'input' },
  { type: 'deltatime', label: 'Delta Time', description: 'Time since last frame', category: 'input' },
  { type: 'uv', label: 'UV', description: 'Texture coordinates', category: 'input' },
  { type: 'keydown', label: 'Key Down', description: 'Key pressed event', category: 'input' },
  { type: 'keyup', label: 'Key Up', description: 'Key released event', category: 'input' },
  { type: 'cursordown', label: 'Cursor Down', description: 'Mouse button pressed', category: 'input' },
  { type: 'cursorup', label: 'Cursor Up', description: 'Mouse button released', category: 'input' },
  { type: 'cursorpos', label: 'Cursor Pos', description: 'Mouse position', category: 'input' },
];

export const nodeCategories: NodeCategory[] = [
  { name: 'Constant', nodes: nodeRegistry.filter(n => n.category === 'constant') },
  { name: 'Arithmetic', nodes: nodeRegistry.filter(n => n.category === 'arithmetic') },
  { name: 'Math', nodes: nodeRegistry.filter(n => n.category === 'math') },
  { name: 'Trigonometry', nodes: nodeRegistry.filter(n => n.category === 'trigonometry') },
  { name: 'Logic', nodes: nodeRegistry.filter(n => n.category === 'logic') },
  { name: 'Vector', nodes: nodeRegistry.filter(n => n.category === 'vector') },
  { name: 'Matrix', nodes: nodeRegistry.filter(n => n.category === 'matrix') },
  { name: 'Input', nodes: nodeRegistry.filter(n => n.category === 'input') },
];

export const shortcutMap: Record<string, string> = {};
nodeRegistry.forEach(node => {
  if (node.shortcut) {
    shortcutMap[node.shortcut] = node.type;
  }
});

export function getNodeTypeByShortcut(key: string): string | null {
  return shortcutMap[key] || null;
}
