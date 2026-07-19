import type { EdgeId, NodeId, SourceReference } from './base.js';

/**
 * 14 canonical Edge types used in the Knowledge Graph.
 */
export enum EdgeType {
  Requires = 'requires',
  DependsOn = 'depends_on',
  Implements = 'implements',
  Extends = 'extends',
  Specializes = 'specializes',
  ConflictsWith = 'conflicts_with',
  Validates = 'validates',
  Produces = 'produces',
  Consumes = 'consumes',
  Replaces = 'replaces',
  Supersedes = 'supersedes',
  RelatedTo = 'related_to',
  Exemplifies = 'exemplifies',
  EnforcedBy = 'enforced_by',
}

/**
 * Default weights for path-scoring during graph traversal.
 */
export const DEFAULT_EDGE_WEIGHTS: Record<EdgeType, number> = {
  [EdgeType.Requires]: 1.0,
  [EdgeType.DependsOn]: 0.95,
  [EdgeType.Implements]: 0.9,
  [EdgeType.Validates]: 0.85,
  [EdgeType.ConflictsWith]: 1.0,
  [EdgeType.Extends]: 0.8,
  [EdgeType.Specializes]: 0.75,
  [EdgeType.Produces]: 0.7,
  [EdgeType.Consumes]: 0.7,
  [EdgeType.Exemplifies]: 0.6,
  [EdgeType.Replaces]: 0.8,
  [EdgeType.Supersedes]: 0.9,
  [EdgeType.RelatedTo]: 0.4,
  [EdgeType.EnforcedBy]: 0.5,
};

/**
 * Represents a relationship condition.
 */
export interface RelationshipCondition {
  expression: string;
  description?: string;
}

/**
 * Represents a typed directed edge between knowledge nodes.
 */
export interface Edge {
  id: EdgeId;
  type: EdgeType;
  source: NodeId;
  target: NodeId;
  weight: number;
  bidirectional: boolean;
  conditions?: RelationshipCondition[];
  derivedFrom?: SourceReference;
}
