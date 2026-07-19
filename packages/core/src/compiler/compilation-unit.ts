import { randomUUID } from 'crypto';
import type { CompilationUnit, CompilerConfig, SourceDocument } from './types.js';

/**
 * Initializes a new CompilationUnit with the given configuration and documents.
 */
export function createCompilationUnit(
  config: CompilerConfig,
  documents: SourceDocument[],
): CompilationUnit {
  const compilationId = randomUUID();
  return {
    config,
    documents,
    asts: new Map(),
    kirModule: {
      id: randomUUID(),
      compilationId,
      createdAt: new Date().toISOString(),
      nodes: new Map(),
      edges: new Map(),
      sources: new Map(documents.map((d) => [d.id, d])),
      passResults: [],
      diagnostics: [],
      ontologyVersion: '0.1.0',
    },
    diagnostics: [],
    passResults: [],
  };
}
