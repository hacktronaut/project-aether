import type { NodeId, EdgeId, ISO8601 } from './base.js';
import type { KnowledgeNode } from './nodes/base.js';
import type { Edge, EdgeType } from './edge.js';

export interface GraphStats {
  nodeCount: number;
  edgeCount: number;
  nodeCountByType: Record<string, number>;
  edgeCountByType: Record<string, number>;
}

/**
 * EnterpriseKnowledgeGraph defines the read/write contract for the compiled graph.
 */
export interface EnterpriseKnowledgeGraph {
  readonly id: string;
  readonly version: string;
  readonly createdAt: ISO8601;

  addNode(node: KnowledgeNode): void;
  getNode(id: NodeId): KnowledgeNode | undefined;
  hasNode(id: NodeId): boolean;
  removeNode(id: NodeId): void;
  getNodes(): KnowledgeNode[];

  addEdge(edge: Edge): void;
  getEdge(id: EdgeId): Edge | undefined;
  hasEdge(id: EdgeId): boolean;
  removeEdge(id: EdgeId): void;
  getEdges(): Edge[];

  getOutgoingEdges(id: NodeId, type?: EdgeType): Edge[];
  getIncomingEdges(id: NodeId, type?: EdgeType): Edge[];

  getStats(): GraphStats;
  clear(): void;
}
