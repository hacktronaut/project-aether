import type { OptimizationPass } from '../../types.js';
import type { KIRSubgraph } from '../../../kir/types.js';

export class O2SemanticDeduplication implements OptimizationPass {
  readonly id = 'O2';
  readonly name = 'Semantic Deduplication';

  async run(subgraph: KIRSubgraph, _mission: any): Promise<void> {
    let duplicatesRemoved = 0;
    const seen = new Map<string, string>(); // 'type:name' -> nodeId
    const nodesToRemove = new Set<string>();

    for (const node of subgraph.nodes.values()) {
      const name = node.rawProperties['name'] || node.id;
      const key = `${node.canonicalType}:${name.toLowerCase()}`;
      if (seen.has(key)) {
        const keptNodeId = seen.get(key)!;
        nodesToRemove.add(node.id);
        
        // Redirect edges to keptNodeId
        for (const edge of subgraph.edges.values()) {
          if (edge.source === node.id) edge.source = keptNodeId;
          if (edge.target === node.id) edge.target = keptNodeId;
        }
        duplicatesRemoved++;
      } else {
        seen.set(key, node.id);
      }
    }

    // Remove duplicates
    for (const id of nodesToRemove) {
      subgraph.nodes.delete(id);
    }

    if (duplicatesRemoved > 0) {
      // O2 duplicate nodes removed silently; callers can inspect the subgraph directly
    }
  }
}
