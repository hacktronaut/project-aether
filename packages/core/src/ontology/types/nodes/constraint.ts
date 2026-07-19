import type { KnowledgeNode } from './base.js';

export enum ConstraintType {
  Structural = 'Structural',
  Behavioral = 'Behavioral',
  Temporal = 'Temporal',
  Resource = 'Resource',
  Security = 'Security',
}

export enum ImpactLevel {
  Critical = 'Critical',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

/**
 * Constraint represents a hard invariant that must not be violated.
 */
export interface Constraint extends KnowledgeNode {
  directive: string;
  constraintType: ConstraintType;
  violation?: string;
  verificationMethod: string;
  impact: ImpactLevel;
  enforcement: string;
}
