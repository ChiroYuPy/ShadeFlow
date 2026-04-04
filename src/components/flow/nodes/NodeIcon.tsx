import React from 'react';

export interface NodeIconProps {
  type: string;
  size?: number;
  variant?: 'node' | 'ui';
}

export default function NodeIcon({ type, size = 14, variant = 'node' }: NodeIconProps) {
  const svgSize = Math.round(size * 0.7); // SVG 70% de la taille du conteneur
  const strokeWidth = 2.5;

  const content = getSvgForType(type, svgSize, strokeWidth);
  if (!content) return null;

  const nodeClasses = "flex items-center justify-center shrink-0 rounded bg-zinc-700/50";
  const uiClasses = "flex items-center justify-center shrink-0 rounded bg-dark-bg-elevated";

  return (
    <div
      className={variant === 'ui' ? uiClasses : nodeClasses}
      style={{ width: size, height: size }}
    >
      {content}
    </div>
  );
}

export function getCategoryIcon(category: string): React.ReactNode {
  const iconMap: Record<string, string> = {
    'Constant': 'vec4',
    'Arithmetic': 'add',
    'Math': 'sqrt',
    'Trigonometry': 'sin',
    'Logic': 'and',
    'Vector': 'normalize',
    'Matrix': 'matrixidentity',
    'Input': 'time',
  };

  const nodeType = iconMap[category] || 'float';
  return <NodeIcon type={nodeType} size={32} variant="ui" />;
}

function getSvgForType(type: string, size: number, strokeWidth: number) {
  const commonProps = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (type) {
    // Constant
    case 'float':
      return (
        <svg {...commonProps} className="text-blue-400">
          <path d="M4 9h16" />
          <path d="M4 15h16" />
          <path d="M10 3v18" />
          <path d="M14 3v18" />
        </svg>
      );
    case 'vec2':
      return (
        <svg {...commonProps} className="text-emerald-400">
          <path d="M5 12h14" />
          <path d="M12 5l7 7-7 7" />
        </svg>
      );
    case 'vec3':
      return (
        <svg {...commonProps} className="text-amber-400">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
    case 'vec4':
      return (
        <svg {...commonProps} className="text-red-400">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      );
    case 'color':
      return (
        <svg {...commonProps} className="text-pink-400">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a10 10 0 0 1 10 10" className="text-red-500" strokeWidth={2.5} />
          <path d="M12 22a10 10 0 0 1-10-10" className="text-blue-500" strokeWidth={2.5} />
          <path d="M2 12a10 10 0 0 1 10-10" className="text-green-500" strokeWidth={2.5} />
          <path d="M22 12a10 10 0 0 1-10 10" className="text-yellow-500" strokeWidth={2.5} />
        </svg>
      );

    // Arithmetic
    case 'add':
      return (
        <svg {...commonProps} className="text-green-400">
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );
    case 'subtract':
      return (
        <svg {...commonProps} className="text-orange-400">
          <path d="M5 12h14" />
        </svg>
      );
    case 'multiply':
      return (
        <svg {...commonProps} className="text-purple-400">
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </svg>
      );
    case 'divide':
      return (
        <svg {...commonProps} className="text-cyan-400">
          <path d="M5 12h14" />
          <circle cx="12" cy="6" r="1" fill="currentColor" />
          <circle cx="12" cy="18" r="1" fill="currentColor" />
        </svg>
      );

    // Math
    case 'power':
      return (
        <svg {...commonProps} className="text-yellow-400">
          <path d="M7 12h10" />
          <path d="M15 8l4 4-4 4" />
          <path d="M5 16v-4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2z" transform="translate(0 -1) scale(0.7)" />
        </svg>
      );
    case 'sqrt':
      return (
        <svg {...commonProps} className="text-pink-400">
          <path d="M5 19h14" />
          <path d="M5 19l4-14 4 6 4-6" />
        </svg>
      );
    case 'abs':
      return (
        <svg {...commonProps} className="text-indigo-400">
          <path d="M6 3v18" />
          <path d="M6 12l6-9 6 9" />
          <path d="M18 3v18" />
        </svg>
      );
    case 'min':
      return (
        <svg {...commonProps} className="text-teal-400">
          <path d="M8 6l-6 6 6 6" />
          <path d="M2 12h20" />
        </svg>
      );
    case 'max':
      return (
        <svg {...commonProps} className="text-rose-400">
          <path d="M16 6l6 6-6 6" />
          <path d="M2 12h20" />
        </svg>
      );
    case 'clamp':
      return (
        <svg {...commonProps} className="text-violet-400">
          <path d="M4 6v12" />
          <path d="M20 6v12" />
          <path d="M8 12h8" />
          <path d="M12 8v8" />
        </svg>
      );
    case 'mix':
      return (
        <svg {...commonProps} className="text-fuchsia-400">
          <path d="M4 12h4" />
          <path d="M16 12h4" />
          <circle cx="8" cy="12" r="2" />
          <circle cx="16" cy="12" r="2" />
          <path d="M10 12h4" />
        </svg>
      );
    case 'step':
      return (
        <svg {...commonProps} className="text-lime-400">
          <path d="M6 18v-8a2 2 0 0 1 2-2h8a2 2 0 0 0 2-2V4" />
        </svg>
      );
    case 'smoothstep':
      return (
        <svg {...commonProps} className="text-sky-400">
          <path d="M6 18c0-8 4-8 6-8s6 0 6-8" />
        </svg>
      );

    // Trigonometry
    case 'sin':
    case 'cos':
    case 'tan':
      const trigColor = type === 'sin' ? 'text-green-400' : type === 'cos' ? 'text-blue-400' : 'text-purple-400';
      return (
        <svg {...commonProps} className={trigColor}>
          <path d="M2 12s3-7 7-7 5 7 10 7 5-7 5-7" />
        </svg>
      );

    // Logic
    case 'and':
      return (
        <svg {...commonProps} className="text-emerald-400">
          <path d="M8 18v-6a4 4 0 0 1 8 0v6" />
          <path d="M8 14h8" />
        </svg>
      );
    case 'or':
      return (
        <svg {...commonProps} className="text-sky-400">
          <path d="M8 6v6a4 4 0 0 0 8 0V6" />
        </svg>
      );
    case 'not':
      return (
        <svg {...commonProps} className="text-red-400">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4" />
          <path d="M12 16v.01" />
        </svg>
      );
    case 'compare':
      return (
        <svg {...commonProps} className="text-yellow-400">
          <path d="M5 9l4 4-4 4" />
          <path d="M15 9l4 4-4 4" />
        </svg>
      );
    case 'if':
      return (
        <svg {...commonProps} className="text-purple-400">
          <path d="M4 20h16" />
          <path d="M8 16l4-8 4 8" />
          <path d="M8 12l4-4 4 4" />
        </svg>
      );

    // Vector
    case 'dot':
      return (
        <svg {...commonProps} className="text-blue-400">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      );
    case 'cross':
      return (
        <svg {...commonProps} className="text-purple-400">
          <path d="M12 4v16" />
          <path d="M4 12h16" />
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </svg>
      );
    case 'normalize':
      return (
        <svg {...commonProps} className="text-cyan-400">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 5v4" />
          <path d="M12 15v4" />
          <path d="M5 12h4" />
          <path d="M15 12h4" />
        </svg>
      );
    case 'length':
      return (
        <svg {...commonProps} className="text-green-400">
          <path d="M5 19L19 5" />
          <circle cx="5" cy="19" r="2" />
          <circle cx="19" cy="5" r="2" />
        </svg>
      );
    case 'distance':
      return (
        <svg {...commonProps} className="text-orange-400">
          <circle cx="9" cy="9" r="2" />
          <circle cx="15" cy="15" r="2" />
          <path d="M9 11c2-2 4-2 6 0" />
        </svg>
      );
    case 'reflect':
      return (
        <svg {...commonProps} className="text-pink-400">
          <path d="M4 12h16" />
          <path d="M12 4l-4 8h8l-4 8" />
        </svg>
      );
    case 'refract':
      return (
        <svg {...commonProps} className="text-indigo-400">
          <path d="M4 12h16" />
          <path d="M8 12l4-8 4 8" />
          <path d="M12 20l4-8" />
        </svg>
      );

    // Matrix
    case 'matrixidentity':
      return (
        <svg {...commonProps} className="text-blue-400">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      );
    case 'matrixmultiply':
      return (
        <svg {...commonProps} className="text-purple-400">
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
      );
    case 'matrixinverse':
      return (
        <svg {...commonProps} className="text-red-400">
          <path d="M4 12h16" />
          <path d="M12 4v16" />
          <path d="M8 8l8 8" />
          <path d="M16 8l-8 8" />
        </svg>
      );
    case 'matrixtranspose':
      return (
        <svg {...commonProps} className="text-green-400">
          <path d="M12 3v18" />
          <path d="M3 12h18" />
          <path d="M8 8l4-4 4 4" />
        </svg>
      );

    // Input
    case 'time':
      return (
        <svg {...commonProps} className="text-amber-400">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      );
    case 'deltatime':
      return (
        <svg {...commonProps} className="text-orange-400">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      );
    case 'uv':
      return (
        <svg {...commonProps} className="text-cyan-400">
          <path d="M3 3h18v18H3z" />
          <path d="M3 3l9 9 9-9" />
        </svg>
      );
    case 'keydown':
      return (
        <svg {...commonProps} className="text-green-400">
          <path d="M6 9H4.5a2 2 0 0 1 0-4H6" />
          <path d="M18 9h1.5a2 2 0 0 0 0-4H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      );
    case 'keyup':
      return (
        <svg {...commonProps} className="text-red-400">
          <path d="M6 9H4.5a2 2 0 0 1 0-4H6" />
          <path d="M18 9h1.5a2 2 0 0 0 0-4H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      );
    case 'cursordown':
      return (
        <svg {...commonProps} className="text-green-400">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
          <path d="M13 13l6 6" />
        </svg>
      );
    case 'cursorup':
      return (
        <svg {...commonProps} className="text-red-400">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
          <path d="M13 13l6 6" />
        </svg>
      );
    case 'cursorpos':
      return (
        <svg {...commonProps} className="text-blue-400">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
          <path d="M13 13l6 6" />
        </svg>
      );

    // Output
    case 'output':
      return (
        <svg {...commonProps} className="text-purple-400">
          <path d="M5 12h14" />
          <path d="M12 5l7 7-7 7" />
          <circle cx="5" cy="12" r="2" fill="currentColor" />
        </svg>
      );

    default:
      return null;
  }
}
