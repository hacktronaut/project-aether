import type { KnowledgeNode } from './base.js';

export enum RuleCategory {
  Architectural = 'Architectural',
  Implementation = 'Implementation',
  Style = 'Style',
  Security = 'Security',
  Quality = 'Quality',
}

export enum EnforcementLevel {
  Strict = 'Strict',
  Linting = 'Linting',
  Convention = 'Convention',
}

/**
 * Rule represents a behavioral or structural directive.
 */
export interface Rule extends KnowledgeNode {
  directive: string;
  category: RuleCategory;
  applicability?: string;
  enforcement: EnforcementLevel;
  rationale: string;
  exceptions?: string[];
  verification?: string;
}
