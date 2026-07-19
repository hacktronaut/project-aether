import type { NodeType, Priority, Scope, ISO8601 } from '../ontology/index.js';

export enum KIRNodeStatus {
  Candidate = 'Candidate',
  Mapped = 'Mapped',
  Active = 'Active',
  Deprecated = 'Deprecated',
  Inlined = 'Inlined',
  FoldedInto = 'FoldedInto',
  Pruned = 'Pruned',
  Eliminated = 'Eliminated',
}

export enum KIREdgeStatus {
  Active = 'Active',
  Redirected = 'Redirected',
  Removed = 'Removed',
}

export enum EdgeDiscoveryMethod {
  Explicit = 'Explicit',
  CoLocation = 'CoLocation',
  NameMatching = 'NameMatching',
  Synthetic = 'Synthetic',
}

export interface KIRNodeModification {
  passId: string;
  field: string;
  before: any;
  after: any;
  timestamp: ISO8601;
}

export interface InlinedRule {
  id: string;
  name: string;
  directive: string;
  priority: Priority;
  scope: Scope[];
}

export interface KIRNode {
  id: string;
  tentativeType: string;
  canonicalType: NodeType | null;
  rawProperties: Record<string, string>;
  typedProperties: Record<string, any>;
  sourceDocId: string;
  sourceLocation: {
    line: number;
    column: number;
    length: number;
  };
  extractionConfidence: number;
  status: KIRNodeStatus;
  priority: Priority | null;
  scope: Scope[] | null;
  semanticHash: string | null;

  // Optimization/traversal metadata
  relevanceScore: number | null;
  pathScore: number | null;
  inlinedRules: InlinedRule[];
  foldedIntoCapability: string | null;

  // Conflict tracking
  conflictsWith: string[];
  resolvedBy: string | null;

  annotations: Record<string, string>;
  modificationLog: KIRNodeModification[];
}

export interface KIREdge {
  id: string;
  type: string;
  source: string;
  target: string;
  weight: number;
  discoveryMethod: EdgeDiscoveryMethod;
  discoveredInPass: string;
  status: KIREdgeStatus;
}
export interface KIRModule {
  id: string;
  compilationId: string;
  createdAt: ISO8601;
  nodes: Map<string, KIRNode>;
  edges: Map<string, KIREdge>;
  sources: Map<string, any>;
  passResults: any[];
  diagnostics: any[];
  ontologyVersion: string;
}

export interface KIRSubgraph {
  parentGraphId: string;
  missionId: string;
  nodes: Map<string, KIRNode>;
  edges: Map<string, KIREdge>;
  priorityOrder?: string[];
}

