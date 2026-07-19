import type {
  NodeId,
  SemVer,
  SourceReference,
  ISO8601,
  NodeStatus,
  StabilityLevel,
  Priority,
  Scope,
  Annotation,
} from '../base.js';

/**
 * All 12 concrete knowledge node types.
 */
export enum NodeType {
  Rule = 'Rule',
  Constraint = 'Constraint',
  Pattern = 'Pattern',
  Capability = 'Capability',
  Workflow = 'Workflow',
  Decision = 'Decision',
  Policy = 'Policy',
  Technology = 'Technology',
  Example = 'Example',
  QualityGate = 'QualityGate',
  Role = 'Role',
  ApiContract = 'ApiContract',
}

/**
 * Abstract base representation of a Knowledge Node.
 */
export interface KnowledgeNode {
  id: NodeId;
  name: string;
  type: NodeType;
  version: SemVer;
  sourceRef?: SourceReference;
  createdAt: ISO8601;
  updatedAt: ISO8601;
  status: NodeStatus;
  stability: StabilityLevel;
  priority: Priority;
  scope: Scope[];
  tags: string[];
  confidence: number;
  description: string;
  annotations?: Annotation[];
}
