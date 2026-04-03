import type { Connection } from 'reactflow';
import { getTypeFromHandleId, canConvert } from '../types/ShaderType';

export function validateConnection(connection: Connection): { valid: boolean; reason?: string } {
  const { sourceHandle, targetHandle } = connection;

  if (!sourceHandle || !targetHandle) {
    return { valid: false, reason: 'Missing handles' };
  }

  const sourceType = getTypeFromHandleId(sourceHandle);
  const targetType = getTypeFromHandleId(targetHandle);

  if (!sourceType || !targetType) {
    return { valid: false, reason: 'Invalid handle type' };
  }

  if (!canConvert(sourceType, targetType)) {
    return {
      valid: false,
      reason: `Cannot convert ${sourceType} to ${targetType}`,
    };
  }

  return { valid: true };
}
