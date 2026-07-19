import type { OptimizationPass } from '../../types.js';
import type { KIRSubgraph } from '../../../kir/types.js';
import { KIRNodeStatus } from '../../../kir/types.js';
import { Priority } from '../../../ontology/index.js';

/**
 * O4ContextCompression scores nodes using a relevance function and compresses the context to fit a budget.
 */
export class O4ContextCompression implements OptimizationPass {
  readonly id = 'O4';
  readonly name = 'Context Compression';

  async run(subgraph: KIRSubgraph, mission: any): Promise<void> {
    const anchorNodes: string[] = mission?.anchorNodes || [];
    const missionScopes: string[] = mission?.scope || [];
    const budget = mission?.budget || 10; // Default budget of 10 nodes for MVP

    const distances = this.computeDistances(subgraph, anchorNodes);
    const maxDistance = Math.max(...Array.from(distances.values()), 1);

    const scoredNodes: { id: string; score: number }[] = [];

    for (const [nodeId, node] of subgraph.nodes.entries()) {
      if (node.status !== KIRNodeStatus.Active && node.status !== KIRNodeStatus.Mapped && node.status !== KIRNodeStatus.Candidate) {
        continue;
      }

      // 1. Path Relevance
      const dist = distances.get(nodeId);
      const pathRelevance = dist !== undefined ? 1 - dist / (maxDistance + 1) : 0;

      // 2. Priority Weight
      let priorityWeight = 0.5;
      if (node.priority === Priority.Mandatory) priorityWeight = 1.0;
      else if (node.priority === Priority.Recommended) priorityWeight = 0.8;
      else if (node.priority === Priority.Optional) priorityWeight = 0.5;
      else if (node.priority === Priority.Informational) priorityWeight = 0.2;
      else if (node.priority === Priority.Deprecated) priorityWeight = 0.0;

      // 3. Scope Match
      let scopeMatch = 0;
      if (node.scope && node.scope.length > 0 && missionScopes.length > 0) {
        const matches = node.scope.filter((s) => missionScopes.includes(s));
        scopeMatch = matches.length / missionScopes.length;
      }

      // Relevance Formula
      const score = 0.5 * pathRelevance + 0.35 * priorityWeight + 0.15 * scopeMatch;
      node.relevanceScore = score;

      // Always keep Mandatory nodes regardless of budget
      if (node.priority === Priority.Mandatory) {
        continue;
      }

      scoredNodes.push({ id: nodeId, score });
    }

    // Sort by score descending
    scoredNodes.sort((a, b) => b.score - a.score);

    // Keep top-N based on budget (subtracting mandatory nodes already kept)
    const activeMandatoryCount = Array.from(subgraph.nodes.values()).filter(
      (n) => n.priority === Priority.Mandatory && (n.status === KIRNodeStatus.Active || n.status === KIRNodeStatus.Mapped || n.status === KIRNodeStatus.Candidate)
    ).length;

    const remainingBudget = Math.max(0, budget - activeMandatoryCount);
    const nodesToPrune = scoredNodes.slice(remainingBudget);

    for (const item of nodesToPrune) {
      const node = subgraph.nodes.get(item.id)!;
      node.status = KIRNodeStatus.Pruned;

      // Remove edges associated with pruned node
      for (const edge of subgraph.edges.values()) {
        if (edge.source === item.id || edge.target === item.id) {
          edge.status = 'Removed' as any;
        }
      }
    }
  }

  private computeDistances(subgraph: KIRSubgraph, anchors: string[]): Map<string, number> {
    const distances = new Map<string, number>();
    const queue: string[] = [];

    for (const anchor of anchors) {
      if (subgraph.nodes.has(anchor)) {
        distances.set(anchor, 0);
        queue.push(anchor);
      }
    }

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentDist = distances.get(currentId)!;

      for (const edge of subgraph.edges.values()) {
        if (edge.status === 'Active' && edge.source === currentId) {
          const targetId = edge.target;
          if (subgraph.nodes.has(targetId) && !distances.has(targetId)) {
            distances.set(targetId, currentDist + 1);
            queue.push(targetId);
          }
        }
      }
    }

    return distances;
  }
}
