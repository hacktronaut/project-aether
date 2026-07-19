import type { Priority, Scope, ISO8601 } from '../ontology/types/base.js';

export interface CECHeader {
  id: string;
  compilationId: string;
  createdAt: ISO8601;
  version: string;
  digest: string;
  compressionRatio: number;
  ontologyVersion: string;
}

export interface MissionDescriptor {
  id: string;
  objective: string;
  scope: Scope[];
  preconditions?: string[];
  postconditions?: string[];
}

export interface CapabilityRef {
  id: string;
  name: string;
  capabilityType: string;
  components: string[];
}

export interface ConstraintEntry {
  id: string;
  name: string;
  priority: Priority;
  scope: Scope[];
  constraintType: string;
  directive: string;
  impact: string;
  enforcement: string;
  verificationMethod: string;
}

export interface PatternRef {
  id: string;
  name: string;
  patternType: string;
  structure: string;
  applicability: string;
  rationale: string;
}

export interface DependencyEntry {
  id: string;
  name: string;
  techType: string;
  versionConstraint: string;
  deprecated: boolean;
}

export interface QualityGateEntry {
  id: string;
  name: string;
  gateType: string;
  measurement: string;
  blocking: boolean;
}

export interface OutputSpec {
  id: string;
  name: string;
  format: string;
  schema?: string;
}

export interface ExecutionHint {
  nodeId: string;
  hint: string;
}

export interface ConflictWarning {
  conflictId: string;
  conflictType: string;
  involvedNodes: string[];
  description: string;
  severity: 'Warning' | 'Error';
}

export interface Provenance {
  sourceFiles: string[];
  compilationTimestamp: ISO8601;
}

/**
 * Compiled Execution Context (CEC) representation.
 */
export interface CompiledExecutionContext {
  header: CECHeader;
  mission: MissionDescriptor;
  capabilities: CapabilityRef[];
  constraints: ConstraintEntry[];
  patterns: PatternRef[];
  dependencies: DependencyEntry[];
  qualityGates: QualityGateEntry[];
  expectedOutputs: OutputSpec[];
  executionHints?: ExecutionHint[];
  conflictWarnings?: ConflictWarning[];
  provenance: Provenance;
}
