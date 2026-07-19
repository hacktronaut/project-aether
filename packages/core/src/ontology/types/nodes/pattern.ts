import type { NodeId } from '../base.js';
import type { KnowledgeNode } from './base.js';

export enum PatternType {
  Architectural = 'Architectural',
  Design = 'Design',
  Integration = 'Integration',
  Data = 'DataAccess',
  Security = 'Security',
}

/**
 * Pattern represents a reusable structural design solution.
 */
export interface Pattern extends KnowledgeNode {
  patternType: PatternType;
  structure: string;
  applicability: string;
  rationale: string;
  consequences?: string[];
  alternatives?: NodeId[];
}
