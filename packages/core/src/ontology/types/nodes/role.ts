import type { NodeId } from '../base.js';
import type { KnowledgeNode } from './base.js';

export enum RoleType {
  Human = 'Human',
  AIAgent = 'AIAgent',
  System = 'System',
  External = 'External',
}

/**
 * Role represents an actor (human or AI) participating in software processes.
 */
export interface Role extends KnowledgeNode {
  roleType: RoleType;
  responsibilities: string[];
  permissions?: string[];
  knowledgeDomains?: NodeId[];
  tools?: NodeId[];
}
