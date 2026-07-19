import type { NodeId, ISO8601 } from '../base.js';
import type { KnowledgeNode } from './base.js';

export interface Alternative {
  description: string;
  rejectionReason: string;
}

/**
 * Decision represents a compiled Architecture Decision Record (ADR).
 */
export interface Decision extends KnowledgeNode {
  decisionId: string;
  context: string;
  decisionText: string;
  rationale: string;
  alternatives?: Alternative[];
  consequences?: string[];
  participants?: string[];
  decidedAt: ISO8601;
  supersedes?: NodeId[];
}
