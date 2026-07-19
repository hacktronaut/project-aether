import * as graphology from 'graphology';
import type { DirectedGraph } from 'graphology';
import type { NodeId, EdgeId, ISO8601 } from '../ontology/types/base.js';
import type { KnowledgeNode } from '../ontology/types/nodes/base.js';
import type { Edge, EdgeType } from '../ontology/types/edge.js';
import type { EnterpriseKnowledgeGraph, GraphStats } from '../ontology/types/graph.js';

export class InMemoryGraph implements EnterpriseKnowledgeGraph {
  readonly id: string;
  readonly version: string;
  readonly createdAt: ISO8601;

  private readonly graph: DirectedGraph;

  constructor(id: string, version: string = '0.1.0') {
    this.id = id;
    this.version = version;
    this.createdAt = new Date().toISOString();

    const GraphConstructor = (graphology as any).default || graphology;
    this.graph = new GraphConstructor({ type: 'directed' });
  }

  addNode(node: KnowledgeNode): void {
    if (this.graph.hasNode(node.id)) {
      this.graph.setNodeAttribute(node.id, 'data', node);
    } else {
      this.graph.addNode(node.id, { data: node });
    }
  }

  getNode(id: NodeId): KnowledgeNode | undefined {
    if (!this.graph.hasNode(id)) {
      return undefined;
    }
    return this.graph.getNodeAttribute(id, 'data') as KnowledgeNode;
  }

  hasNode(id: NodeId): boolean {
    return this.graph.hasNode(id);
  }

  removeNode(id: NodeId): void {
    if (this.graph.hasNode(id)) {
      this.graph.dropNode(id);
    }
  }

  getNodes(): KnowledgeNode[] {
    const nodes: KnowledgeNode[] = [];
    this.graph.forEachNode((_node, attributes) => {
      if (attributes['data']) {
        nodes.push(attributes['data'] as KnowledgeNode);
      }
    });
    return nodes;
  }

  addEdge(edge: Edge): void {
    if (!this.graph.hasNode(edge.source) || !this.graph.hasNode(edge.target)) {
      throw new Error(`Cannot add edge: source (${edge.source}) or target (${edge.target}) node does not exist in graph`);
    }

    if (this.graph.hasEdge(edge.source, edge.target)) {
      const existingEdges = this.graph.getEdgeAttributes(edge.source, edge.target);
      existingEdges[edge.id] = edge;
    } else {
      this.graph.addEdge(edge.source, edge.target, { [edge.id]: edge });
    }
  }

  getEdge(id: EdgeId): Edge | undefined {
    let foundEdge: Edge | undefined;
    this.graph.forEachEdge((_edge, attributes) => {
      for (const e of Object.values(attributes)) {
        if ((e as any).id === id) {
          foundEdge = e as Edge;
          return;
        }
      }
    });
    return foundEdge;
  }

  hasEdge(id: EdgeId): boolean {
    return this.getEdge(id) !== undefined;
  }

  removeEdge(id: EdgeId): void {
    this.graph.forEachEdge((edge, attributes, _source, _target) => {
      if (attributes[id]) {
        delete attributes[id];
        if (Object.keys(attributes).length === 0) {
          this.graph.dropEdge(edge);
        }
      }
    });
  }

  getEdges(): Edge[] {
    const edges: Edge[] = [];
    this.graph.forEachEdge((_edge, attributes) => {
      for (const e of Object.values(attributes)) {
        edges.push(e as Edge);
      }
    });
    return edges;
  }

  getOutgoingEdges(id: NodeId, type?: EdgeType): Edge[] {
    if (!this.graph.hasNode(id)) {
      return [];
    }
    const edges: Edge[] = [];
    this.graph.forEachOutEdge(id, (_edge, attributes) => {
      for (const e of Object.values(attributes)) {
        const edgeObj = e as Edge;
        if (!type || edgeObj.type === type) {
          edges.push(edgeObj);
        }
      }
    });
    return edges;
  }

  getIncomingEdges(id: NodeId, type?: EdgeType): Edge[] {
    if (!this.graph.hasNode(id)) {
      return [];
    }
    const edges: Edge[] = [];
    this.graph.forEachInEdge(id, (_edge, attributes) => {
      for (const e of Object.values(attributes)) {
        const edgeObj = e as Edge;
        if (!type || edgeObj.type === type) {
          edges.push(edgeObj);
        }
      }
    });
    return edges;
  }

  getStats(): GraphStats {
    const stats: GraphStats = {
      nodeCount: this.graph.order,
      edgeCount: this.getEdges().length,
      nodeCountByType: {},
      edgeCountByType: {},
    };

    for (const node of this.getNodes()) {
      stats.nodeCountByType[node.type] = (stats.nodeCountByType[node.type] ?? 0) + 1;
    }

    for (const edge of this.getEdges()) {
      stats.edgeCountByType[edge.type] = (stats.edgeCountByType[edge.type] ?? 0) + 1;
    }

    return stats;
  }

  clear(): void {
    this.graph.clear();
  }
}
