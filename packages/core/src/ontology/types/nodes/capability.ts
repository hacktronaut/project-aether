import type { NodeId } from '../base.js';
import type { KnowledgeNode } from './base.js';

/**
 * Capability represents a folded group of related rules, constraints, and patterns.
 */
export interface Capability extends KnowledgeNode {
  capabilityType: string;
  components: NodeId[];
  entryPoints?: NodeId[];
  optional?: boolean;
  requiredBy?: NodeId[];
}
