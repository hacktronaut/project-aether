import type { NodeId } from '../base.js';
import type { KnowledgeNode } from './base.js';

export enum WorkflowType {
  Development = 'Development',
  Review = 'Review',
  Deployment = 'Deployment',
  Testing = 'Testing',
  Incident = 'Incident',
}

export interface WorkflowStep {
  order: number;
  name: string;
  actor?: NodeId;
  inputs?: NodeId[];
  outputs?: NodeId[];
  tools?: NodeId[];
  optional?: boolean;
}

/**
 * Workflow represents an ordered sequence of development steps/activities.
 */
export interface Workflow extends KnowledgeNode {
  workflowType: WorkflowType;
  steps: WorkflowStep[];
  parallelizable?: boolean;
  entryConditions?: string[];
  exitConditions?: string[];
  roles?: NodeId[];
  qualityGates?: NodeId[];
}
