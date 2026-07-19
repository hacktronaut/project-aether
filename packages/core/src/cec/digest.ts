import { createHash } from 'crypto';
import type { CompiledExecutionContext } from './types.js';

/**
 * Computes the SHA-256 content digest of a CEC, excluding the header (which changes per run).
 */
export function computeCECDigest(cec: Omit<CompiledExecutionContext, 'header'>): string {
  const serialized = JSON.stringify(cec);
  return createHash('sha256').update(serialized).digest('hex');
}
