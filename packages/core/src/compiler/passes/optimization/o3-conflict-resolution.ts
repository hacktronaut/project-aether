import type { OptimizationPass } from '../../types.js';
import type { KIRSubgraph } from '../../../kir/types.js';
import { EdgeType, Priority } from '../../../ontology/index.js';

export class O3ConflictResolution implements OptimizationPass {
  readonly id = 'O3';
  readonly name = 'Conflict Resolution';

  async run(subgraph: KIRSubgraph, mission: any): Promise<void> {
    let conflictsResolved = 0;
    const nodesToRemove = new Set<string>();

    for (const edge of subgraph.edges.values()) {
      if (edge.type === EdgeType.ConflictsWith && subgraph.nodes.has(edge.source) && subgraph.nodes.has(edge.target)) {
        const sourceNode = subgraph.nodes.get(edge.source)!;
        const targetNode = subgraph.nodes.get(edge.target)!;
        
        // Keep Mandatory over Recommended/Optional
        if (sourceNode.priority === Priority.Mandatory && targetNode.priority !== Priority.Mandatory) {
          nodesToRemove.add(edge.target);
          conflictsResolved++;
        } else if (targetNode.priority === Priority.Mandatory && sourceNode.priority !== Priority.Mandatory) {
          nodesToRemove.add(edge.source);
          conflictsResolved++;
        }
      }
    }

    for (const id of nodesToRemove) {
      subgraph.nodes.delete(id);
    }
    
    if (conflictsResolved > 0) {
      console.log(`[O3] Resolved ${conflictsResolved} conflicts by priority dropping.`);
    }
  }
}
