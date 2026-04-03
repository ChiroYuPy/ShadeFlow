import { getBezierPath } from 'reactflow';

export default function Edge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style }: any) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <path
      id={id}
      d={edgePath}
      stroke={style?.stroke || '#888'}
      strokeWidth={style?.strokeWidth || 2}
      fill="none"
    />
  );
}
