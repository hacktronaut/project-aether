import type { KIRModule, KIRNode, KIREdge } from './types.js';
import { KIRNodeStatus, KIREdgeStatus } from './types.js';

export interface KIROperations {
  addNode(node: Omit<KIRNode, 'modificationLog' | 'inlinedRules' | 'foldedIntoCapability' | 'conflictsWith' | 'resolvedBy' | 'relevanceScore' | 'pathScore'>): string;
  getNode(id: string): KIRNode | undefined;
  updateNode(id: string, changes: Partial<KIRNode>, passId: string): void;
  removeNode(id: string, passId: string, reason: KIRNodeStatus): void;

  addEdge(edge: Omit<KIREdge, 'status'>): string;
  getEdge(id: string): KIREdge | undefined;
  removeEdge(id: string, passId: string): void;
  redirectEdge(id: string, newTarget: string, passId: string): void;

  getActiveNodes(): KIRNode[];
  getActiveEdges(): KIREdge[];
  getOutgoingEdges(nodeId: string, type?: string): KIREdge[];
  getIncomingEdges(nodeId: string, type?: string): KIREdge[];
  getNodesByType(type: string): KIRNode[];
  getNodesByStatus(status: KIRNodeStatus): KIRNode[];
}

export class KIRModuleController implements KIROperations {
  constructor(private readonly module: KIRModule) {}

  addNode(node: Omit<KIRNode, 'modificationLog' | 'inlinedRules' | 'foldedIntoCapability' | 'conflictsWith' | 'resolvedBy' | 'relevanceScore' | 'pathScore'>): string {
    const fullNode: KIRNode = {
      ...node,
      relevanceScore: null,
      pathScore: null,
      inlinedRules: [],
      foldedIntoCapability: null,
      conflictsWith: [],
      resolvedBy: null,
      modificationLog: [
        {
          passId: 'INIT',
          field: 'status',
          before: null,
          after: node.status,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    this.module.nodes.set(node.id, fullNode);
    return node.id;
  }

  getNode(id: string): KIRNode | undefined {
    return this.module.nodes.get(id);
  }

  updateNode(id: string, changes: Partial<KIRNode>, passId: string): void {
    const node = this.module.nodes.get(id);
    if (!node) {
      throw new Error(`Node ${id} not found in KIRModule`);
    }

    const timestamp = new Date().toISOString();
    for (const [key, value] of Object.entries(changes)) {
      const before = (node as any)[key];
      if (before !== value) {
        (node as any)[key] = value;
        node.modificationLog.push({
          passId,
          field: key,
          before,
          after: value,
          timestamp,
        });
      }
    }
  }

  removeNode(id: string, passId: string, reason: KIRNodeStatus): void {
    const node = this.module.nodes.get(id);
    if (node) {
      this.updateNode(id, { status: reason }, passId);
      // Remove or redirect any active edges to/from this node
      for (const edge of this.module.edges.values()) {
        if (edge.status === KIREdgeStatus.Active) {
          if (edge.source === id || edge.target === id) {
            this.removeEdge(edge.id, passId);
          }
        }
      }
    }
  }

  addEdge(edge: Omit<KIREdge, 'status'>): string {
    const fullEdge: KIREdge = {
      ...edge,
      status: KIREdgeStatus.Active,
    };
    this.module.edges.set(edge.id, fullEdge);
    return edge.id;
  }

  getEdge(id: string): KIREdge | undefined {
    return this.module.edges.get(id);
  }

  removeEdge(id: string, _passId: string): void {
    const edge = this.module.edges.get(id);
    if (edge && edge.status === KIREdgeStatus.Active) {
      edge.status = KIREdgeStatus.Removed;
    }
  }

  redirectEdge(id: string, newTarget: string, _passId: string): void {
    const edge = this.module.edges.get(id);
    if (edge && edge.status === KIREdgeStatus.Active) {
      edge.target = newTarget;
      edge.status = KIREdgeStatus.Redirected;
    }
  }

  getActiveNodes(): KIRNode[] {
    return Array.from(this.module.nodes.values()).filter(
      (n) => n.status === KIRNodeStatus.Active || n.status === KIRNodeStatus.Mapped || n.status === KIRNodeStatus.Candidate
    );
  }

  getActiveEdges(): KIREdge[] {
    return Array.from(this.module.edges.values()).filter(
      (e) => e.status === KIREdgeStatus.Active
    );
  }

  getOutgoingEdges(nodeId: string, type?: string): KIREdge[] {
    return this.getActiveEdges().filter(
      (e) => e.source === nodeId && (!type || e.type === type)
    );
  }

  getIncomingEdges(nodeId: string, type?: string): KIREdge[] {
    return this.getActiveEdges().filter(
      (e) => e.target === nodeId && (!type || e.type === type)
    );
  }

  getNodesByType(type: string): KIRNode[] {
    return this.getActiveNodes().filter(
      (n) => n.canonicalType === type || n.tentativeType === type
    );
  }

  getNodesByStatus(status: KIRNodeStatus): KIRNode[] {
    return Array.from(this.module.nodes.values()).filter((n) => n.status === status);
  }
}
