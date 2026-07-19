import type { CompilerConfig } from './types.js';

/**
 * Creates a default CompilerConfig.
 */
export function createDefaultConfig(overrides?: Partial<CompilerConfig>): CompilerConfig {
  return {
    sourceDirectories: ['./docs'],
    outputGraphPath: './.aether/graph.json',
    fixedPointIteration: false,
    strict: false,
    conflictPolicy: 'warn',
    ...overrides,
  };
}
