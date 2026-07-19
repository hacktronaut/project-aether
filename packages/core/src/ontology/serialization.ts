import type { KnowledgeNode } from './types/nodes/base.js';
import type { Edge } from './types/edge.js';
import type { EnterpriseKnowledgeGraph } from './types/graph.js';

export interface SerializedGraph {
  id: string;
  version: string;
  createdAt: string;
  nodes: KnowledgeNode[];
  edges: Edge[];
}

/**
 * Serializes a single KnowledgeNode to JSON string.
 */
export function serializeNode(node: KnowledgeNode): string {
  return JSON.stringify(node, null, 2);
}

/**
 * Deserializes a single KnowledgeNode from JSON string.
 */
export function deserializeNode(json: string): KnowledgeNode {
  const node = JSON.parse(json) as KnowledgeNode;
  if (!node.id || !node.name || !node.type) {
    throw new Error(`Invalid serialized node: missing id, name or type`);
  }
  return node;
}

/**
 * Serializes an EnterpriseKnowledgeGraph to a JSON string representation.
 */
export function serializeGraph(graph: EnterpriseKnowledgeGraph): string {
  const serialized: SerializedGraph = {
    id: graph.id,
    version: graph.version,
    createdAt: graph.createdAt,
    nodes: graph.getNodes(),
    edges: graph.getEdges(),
  };
  return JSON.stringify(serialized, null, 2);
}

/**
 * Deserializes a JSON string and populates the given EnterpriseKnowledgeGraph.
 */
export function deserializeGraph(json: string, graph: EnterpriseKnowledgeGraph): void {
  const parsed = JSON.parse(json) as SerializedGraph;
  if (!parsed.id || !parsed.version || !parsed.nodes || !parsed.edges) {
    throw new Error('Invalid serialized graph format');
  }

  graph.clear();

  for (const node of parsed.nodes) {
    graph.addNode(node);
  }

  for (const edge of parsed.edges) {
    graph.addEdge(edge);
  }
}
