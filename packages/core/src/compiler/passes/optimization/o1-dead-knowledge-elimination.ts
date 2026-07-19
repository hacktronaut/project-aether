import type { OptimizationPass } from '../../types.js';
import type { KIRSubgraph } from '../../../kir/types.js';
import { KIRNodeStatus } from '../../../kir/types.js';

/**
 * O1DeadKnowledgeElimination prunes nodes not reachable from mission anchor nodes.
 */
export class O1DeadKnowledgeElimination implements OptimizationPass {
  readonly id = 'O1';
  readonly name = 'Dead Knowledge Elimination';

  async run(subgraph: KIRSubgraph, mission: any): Promise<void> {
    const anchorNodes: string[] = mission?.anchorNodes || [];
    if (anchorNodes.length === 0) {
      // If no anchors specified, nothing is pruned by O1 in Phase A
      return;
    }

    const reachable = new Set<string>();
    const queue: string[] = [...anchorNodes];

    // Initialize queue with valid anchors present in subgraph
    for (const anchor of anchorNodes) {
      if (subgraph.nodes.has(anchor)) {
        reachable.add(anchor);
      }
    }

    // BFS traversal
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      
      // Find all active outgoing edges from this node
      for (const edge of subgraph.edges.values()) {
        if (edge.status === 'Active' && edge.source === currentId) {
          const targetId = edge.target;
          if (subgraph.nodes.has(targetId) && !reachable.has(targetId)) {
            reachable.add(targetId);
            queue.push(targetId);
          }
        }
      }
    }

    // Eliminate unreachable nodes
    for (const [nodeId, node] of subgraph.nodes.entries()) {
      if (!reachable.has(nodeId)) {
        node.status = KIRNodeStatus.Eliminated;
        
        // Remove associated edges
        for (const edge of subgraph.edges.values()) {
          if (edge.source === nodeId || edge.target === nodeId) {
            edge.status = 'Removed' as any;
          }
        }
      }
    }
  }
}
